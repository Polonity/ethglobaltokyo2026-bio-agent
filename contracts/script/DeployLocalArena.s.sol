// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {Script} from "forge-std/Script.sol";
import {BioAgentRegistry} from "../src/BioAgentRegistry.sol";
import {IBioAgentRegistry} from "../src/interfaces/IBioAgentRegistry.sol";

/// @notice Local-only application bootstrap: Registry plus exactly three registered agents.
contract DeployLocalArena is Script {
    error NotLocalChain(uint256 chainId);

    function run() external returns (BioAgentRegistry registry) {
        if (block.chainid != 31337) revert NotLocalChain(block.chainid);
        address owner = vm.envAddress("DEPLOYER_ADDRESS");
        bytes32 modelHash = vm.envBytes32("LOCAL_MODEL_HASH");
        string memory baseURI = vm.envString("LOCAL_GUI_URL");
        vm.startBroadcast(owner);
        registry = new BioAgentRegistry();
        IBioAgentRegistry app = IBioAgentRegistry(address(registry));
        app.registerAgent(modelHash, string.concat(baseURI, "/models/agents/1.json"));
        app.registerAgent(modelHash, string.concat(baseURI, "/models/agents/2.json"));
        app.registerAgent(modelHash, string.concat(baseURI, "/models/agents/3.json"));
        vm.stopBroadcast();
    }
}
