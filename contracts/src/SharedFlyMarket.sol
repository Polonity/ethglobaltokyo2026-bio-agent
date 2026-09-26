// SPDX-License-Identifier: LicenseRef-Degensoft-Aqua-Source-1.1
pragma solidity 0.8.30;

import {Aqua} from "../vendor/aqua/src/Aqua.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {BioAgentRegistry} from "./BioAgentRegistry.sol";

interface IFlyPool {
    function initialize(uint160) external;
    function mint(address, int24, int24, uint128, bytes calldata) external returns (uint256, uint256);
    function swap(address, bool, int256, uint160, bytes calldata) external returns (int256, int256);
}

interface IFlyFactory {
    function createPool(address, address, uint24) external returns (address);
}

contract SharedFlyToken is ERC20 {
    constructor(string memory label) ERC20(label, label) {
        require(block.chainid == 31337, "local only");
        _mint(msg.sender, 1_000_000 ether);
    }
}

/// @notice Local V3 exact-input adapter; caller pays, caller receives. Never accepts an arbitrary payer.
contract FlyV3Router {
    ERC20 public immutable token0;
    ERC20 public immutable token1;
    IFlyPool public immutable pool;
    address public immutable owner;
    address private payer;
    bool private quoting;
    error Quoted(uint256 output);

    constructor(address factory, address a, address b) {
        require(block.chainid == 31337, "local only");
        owner = msg.sender;
        (a, b) = a < b ? (a, b) : (b, a);
        token0 = ERC20(a);
        token1 = ERC20(b);
        pool = IFlyPool(IFlyFactory(factory).createPool(a, b, 3000));
        pool.initialize(uint160(1 << 96));
    }

    function seed() external {
        require(msg.sender == owner && payer == address(0), "owner/idle");
        payer = owner;
        pool.mint(address(this), -887220, 887220, 1000 ether, "");
        payer = address(0);
    }

    function limit(bool direction) private pure returns (uint160) {
        return direction ? 4295128740 : 1461446703485210103287273052203988822378723970341;
    }

    function swap(bool direction, uint256 amount, uint256 minOut, uint256 deadline)
        external
        returns (uint256 output)
    {
        require(payer == address(0) && !quoting, "busy");
        require(block.timestamp <= deadline && amount > 0 && amount <= 10 ether, "bounds/expired");
        payer = msg.sender;
        (int256 a, int256 b) = pool.swap(msg.sender, direction, int256(amount), limit(direction), "");
        output = uint256(-(direction ? b : a));
        require(uint256(direction ? a : b) == amount && output >= minOut, "partial/slippage");
        payer = address(0);
    }

    function quote(bool direction, uint256 amount) external returns (uint256 output) {
        require(payer == address(0) && !quoting && amount > 0 && amount <= 10 ether, "bounds/busy");
        quoting = true;
        try pool.swap(address(this), direction, int256(amount), limit(direction), "") {
            revert("expected revert");
        } catch (bytes memory reason) {
            quoting = false;
            require(reason.length == 36 && bytes4(reason) == Quoted.selector, "quote failed");
            assembly { output := mload(add(reason, 36)) }
        }
    }

    function uniswapV3MintCallback(uint256 a, uint256 b, bytes calldata) external {
        require(msg.sender == address(pool) && payer == owner, "pool/payer");
        if (a > 0) require(token0.transferFrom(payer, msg.sender, a));
        if (b > 0) require(token1.transferFrom(payer, msg.sender, b));
    }

    function uniswapV3SwapCallback(int256 a, int256 b, bytes calldata) external {
        require(msg.sender == address(pool), "pool only");
        if (quoting) revert Quoted(uint256(-(a < 0 ? a : b)));
        require(payer != address(0), "no payer");
        if (a > 0) require(token0.transferFrom(payer, msg.sender, uint256(a)));
        if (b > 0) require(token1.transferFrom(payer, msg.sender, uint256(b)));
    }
}

/// @notice Experimental equal-decimal quote in token1 per token0 (1e18 scale), not a price oracle.
contract SharedAquaFlyApp {
    Aqua public immutable aqua;
    ERC20 public immutable token0;
    ERC20 public immutable token1;
    BioAgentRegistry public immutable registry;
    bool private entered;

    struct Strategy {
        uint256 agentId;
        uint256 revision;
        uint256 spreadBps;
        uint256 priceE18;
        uint256 expiry;
        bytes32 modelHash;
        bytes32 policyHash;
    }
    event Filled(
        address indexed maker,
        bytes32 indexed strategyHash,
        address indexed taker,
        bool zeroForOne,
        uint256 amountIn,
        uint256 amountOut
    );

    constructor(Aqua a, ERC20 t0, ERC20 t1, BioAgentRegistry r) {
        require(block.chainid == 31337, "local only");
        aqua = a;
        token0 = t0;
        token1 = t1;
        registry = r;
        require(t0.approve(address(a), type(uint256).max));
        require(t1.approve(address(a), type(uint256).max));
    }

    function quote(address maker, bytes calldata strategy, bool direction, uint256 amount)
        public
        view
        returns (uint256 out)
    {
        Strategy memory s = abi.decode(strategy, (Strategy));
        require(
            s.priceE18 >= 1e12 && s.priceE18 <= 1e24 && s.spreadBps <= 1000 && amount > 0
                && amount <= 10 ether,
            "bounds"
        );
        require(block.timestamp <= s.expiry, "expired");
        require(
            registry.getAgent(s.agentId).owner == maker
                && registry.getAgent(s.agentId).modelHash == s.modelHash,
            "identity"
        );
        require(registry.getStatus(s.agentId).revision == s.revision, "stale stimulus");
        (uint256 b0, uint256 b1) =
            aqua.safeBalances(maker, address(this), keccak256(strategy), address(token0), address(token1));
        out = direction ? Math.mulDiv(amount, s.priceE18, 1e18) : Math.mulDiv(amount, 1e18, s.priceE18);
        out = Math.mulDiv(out, 10000 - s.spreadBps, 10000);
        ERC20 output = direction ? token1 : token0;
        require(
            out > 0 && out <= (direction ? b1 : b0) && output.balanceOf(maker) >= out
                && output.allowance(maker, address(aqua)) >= out,
            "inventory"
        );
    }

    function swap(
        address maker,
        bytes calldata strategy,
        bool direction,
        uint256 amount,
        uint256 minOut,
        uint256 deadline
    ) external returns (uint256 out) {
        require(!entered && block.timestamp <= deadline, "busy/expired");
        entered = true;
        out = quote(maker, strategy, direction, amount);
        require(out >= minOut, "slippage");
        ERC20 input = direction ? token0 : token1;
        ERC20 output = direction ? token1 : token0;
        require(input.transferFrom(msg.sender, address(this), amount));
        aqua.push(maker, address(this), keccak256(strategy), address(input), amount);
        aqua.pull(maker, keccak256(strategy), address(output), out, msg.sender);
        emit Filled(maker, keccak256(strategy), msg.sender, direction, amount, out);
        entered = false;
    }
}
