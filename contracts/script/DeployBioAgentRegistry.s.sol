// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {Script} from "forge-std/Script.sol";
import {BioAgentRegistry} from "../src/BioAgentRegistry.sol";

/// @notice Simulates by default. Sending a transaction requires forge's --broadcast flag.
contract DeployBioAgentRegistry is Script {
    error UnsupportedChain(uint256 chainId);
    error InvalidDeployer();

    function run() external returns (BioAgentRegistry registry) {
        return deploy(vm.envAddress("DEPLOYER_ADDRESS"));
    }

    function deploy(address deployer) public returns (BioAgentRegistry registry) {
        if (block.chainid != 11155111 && block.chainid != 31337) revert UnsupportedChain(block.chainid);
        if (deployer == address(0)) revert InvalidDeployer();
        vm.startBroadcast(deployer);
        registry = new BioAgentRegistry();
        vm.stopBroadcast();
    }
}
