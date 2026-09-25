// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

interface ILocalPool {
    function initialize(uint160 sqrtPriceX96) external;
    function mint(address recipient, int24 lower, int24 upper, uint128 amount, bytes calldata data)
        external
        returns (uint256, uint256);
    function swap(address recipient, bool zeroForOne, int256 amount, uint160 limit, bytes calldata data)
        external
        returns (int256, int256);
}

interface ILocalFactory {
    function createPool(address, address, uint24) external returns (address);
}

contract LocalMarketToken {
    string public name;
    string public symbol;
    uint8 public constant decimals = 18;
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    event Transfer(address indexed from, address indexed to, uint256 value);

    constructor(string memory label) {
        require(block.chainid == 31337, "Anvil only");
        name = label;
        symbol = label;
        totalSupply = 1_000_000 ether;
        balanceOf[msg.sender] = totalSupply;
        emit Transfer(address(0), msg.sender, totalSupply);
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }
}

/// @notice Test harness for actual Uniswap V3 core. Not a production router or token.
contract LocalMarket {
    address public immutable owner;
    address public immutable pool;
    address public immutable token0;
    address public immutable token1;
    bool private quoting;
    error QuoteResult(uint256 amountOut);

    constructor(address factory, address a, address b) {
        require(block.chainid == 31337, "Anvil only");
        owner = msg.sender;
        (token0, token1) = a < b ? (a, b) : (b, a);
        pool = ILocalFactory(factory).createPool(token0, token1, 3000);
        ILocalPool(pool).initialize(uint160(1 << 96));
    }

    function seed() external {
        require(msg.sender == owner, "owner only");
        ILocalPool(pool).mint(address(this), -887220, 887220, 1000 ether, "");
    }

    function movePrice(bool zeroForOne) external {
        require(msg.sender == owner, "owner only");
        ILocalPool(pool).swap(address(this), zeroForOne, 50 ether, limit(zeroForOne), "");
    }

    function quote(bool zeroForOne, uint256 amountIn) external returns (uint256) {
        require(amountIn > 0 && amountIn <= 100 ether, "quote bounds");
        quoting = true;
        try ILocalPool(pool).swap(address(this), zeroForOne, int256(amountIn), limit(zeroForOne), "") {
            revert("expected quote revert");
        } catch (bytes memory reason) {
            quoting = false;
            if (reason.length != 36) revert("quote failed");
            bytes4 selector;
            uint256 amountOut;
            assembly {
                selector := mload(add(reason, 32))
                amountOut := mload(add(reason, 36))
            }
            require(selector == QuoteResult.selector, "unexpected quote error");
            return amountOut;
        }
    }

    function limit(bool zeroForOne) private pure returns (uint160) {
        return zeroForOne ? 4295128740 : 1461446703485210103287273052203988822378723970341;
    }

    function uniswapV3MintCallback(uint256 a, uint256 b, bytes calldata) external {
        require(msg.sender == pool, "pool only");
        if (a > 0) require(LocalMarketToken(token0).transfer(pool, a));
        if (b > 0) require(LocalMarketToken(token1).transfer(pool, b));
    }

    function uniswapV3SwapCallback(int256 a, int256 b, bytes calldata) external {
        require(msg.sender == pool, "pool only");
        if (quoting) revert QuoteResult(uint256(-(a < 0 ? a : b)));
        if (a > 0) require(LocalMarketToken(token0).transfer(pool, uint256(a)));
        if (b > 0) require(LocalMarketToken(token1).transfer(pool, uint256(b)));
    }
}
