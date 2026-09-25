// SPDX-License-Identifier: LicenseRef-Degensoft-Aqua-Source-1.1
pragma solidity 0.8.30;

import {Aqua} from "../vendor/aqua/src/Aqua.sol";
import {BioAgentRegistry} from "./BioAgentRegistry.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @notice Local test token. No economic value.
contract AquaTestToken is ERC20 {
    constructor(string memory name_) ERC20(name_, name_) {
        _mint(msg.sender, 1000 ether);
    }
}

/// @notice Local experiment: equal-decimal tokens, engineered 1:1 reference rate.
/// Not an oracle, production market maker, or MEV-protection system.
contract AquaFlyApp {
    Aqua public immutable aqua;
    ERC20 public immutable token0;
    ERC20 public immutable token1;
    BioAgentRegistry public immutable registry;
    bool private entered;

    // Strategy identity also binds the agent, confirmed input revision and controller digest.
    struct Strategy {
        uint256 agentId;
        uint256 revision;
        uint256 spreadBps;
        bytes32 modelHash;
    }
    event Filled(
        address indexed maker,
        bytes32 indexed strategyHash,
        address indexed taker,
        uint256 amountIn,
        uint256 amountOut
    );

    constructor(Aqua aqua_, ERC20 token0_, ERC20 token1_, BioAgentRegistry registry_) {
        registry = registry_;
        aqua = aqua_;
        token0 = token0_;
        token1 = token1_;
        require(token0_.approve(address(aqua_), type(uint256).max), "approval");
        require(token1_.approve(address(aqua_), type(uint256).max), "approval");
    }

    function swap(address maker, bytes calldata strategy, bool zeroForOne, uint256 amountIn, uint256 minOut)
        external
        returns (uint256 amountOut)
    {
        require(!entered, "reentrant");
        entered = true;
        Strategy memory s = abi.decode(strategy, (Strategy));
        require(
            s.agentId > 0 && s.agentId <= 3 && s.spreadBps <= 1000 && amountIn > 0 && amountIn <= 100 ether,
            "invalid"
        );
        require(
            registry.getAgent(s.agentId).owner == maker
                && registry.getAgent(s.agentId).modelHash == s.modelHash,
            "identity"
        );
        require(registry.getStatus(s.agentId).revision == s.revision, "stale stimulus");
        bytes32 hash = keccak256(strategy);
        aqua.safeBalances(maker, address(this), hash, address(token0), address(token1));
        amountOut = amountIn * (10000 - s.spreadBps) / 10000;
        require(amountOut > 0 && amountOut >= minOut, "slippage");
        ERC20 input = zeroForOne ? token0 : token1;
        ERC20 output = zeroForOne ? token1 : token0;
        require(input.transferFrom(msg.sender, address(this), amountIn), "transfer");
        aqua.push(maker, address(this), hash, address(input), amountIn);
        aqua.pull(maker, hash, address(output), amountOut, msg.sender);
        emit Filled(maker, hash, msg.sender, amountIn, amountOut);
        entered = false;
    }
}
