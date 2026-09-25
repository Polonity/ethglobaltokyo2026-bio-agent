// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

/// @notice LOCAL TEST ONLY. Emits V3-shaped logs; NOT a pool, swap, or liquidity simulation.
contract SwapEventFixture {
    event Swap(
        address indexed sender,
        address indexed recipient,
        int256 amount0,
        int256 amount1,
        uint160 sqrtPriceX96,
        uint128 liquidity,
        int24 tick
    );

    constructor() {
        require(block.chainid == 31337, "local fixture only");
    }

    function emitPrice(uint160 sqrtPriceX96) external {
        emit Swap(msg.sender, msg.sender, 0, 0, sqrtPriceX96, 1000000, 0);
    }
}
