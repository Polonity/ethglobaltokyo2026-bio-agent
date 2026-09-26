// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {LocalMarket, ILocalPool} from "./LocalMarket.sol";

/// @notice Full-agent experiment inputs: actual V3 swaps of explicitly bounded sizes.
contract FullLocalMarket is LocalMarket {
    constructor(address factory, address a, address b) LocalMarket(factory, a, b) {}

    function movePriceAmount(bool zeroForOne, uint256 amount) external {
        require(msg.sender == owner, "owner only");
        require(amount > 0 && amount <= 50 ether, "amount bounds");
        uint160 bound = zeroForOne ? 4295128740 : 1461446703485210103287273052203988822378723970341;
        ILocalPool(pool).swap(address(this), zeroForOne, int256(amount), bound, "");
    }
}
