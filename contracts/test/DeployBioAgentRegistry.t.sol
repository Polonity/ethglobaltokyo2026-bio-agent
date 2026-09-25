// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {Test} from "forge-std/Test.sol";
import {DeployBioAgentRegistry} from "../script/DeployBioAgentRegistry.s.sol";
import {BioAgentRegistry} from "../src/BioAgentRegistry.sol";

contract DeployBioAgentRegistryTest is Test {
    DeployBioAgentRegistry internal deployScript;

    function setUp() public {
        deployScript = new DeployBioAgentRegistry();
        vm.setEnv("DEPLOYER_ADDRESS", "0x000000000000000000000000000000000000bEEF");
    }

    function testSepoliaSimulationCreatesEmptyRegistry() public {
        vm.chainId(11155111);
        BioAgentRegistry registry = deployScript.run();
        assertGt(address(registry).code.length, 0);
        assertEq(registry.nextAgentId(), 1);
    }

    function testLocalSimulationCreatesRegistry() public {
        vm.chainId(31337);
        assertEq(deployScript.run().nextAgentId(), 1);
    }

    function testRejectsMainnet() public {
        vm.chainId(1);
        vm.expectRevert(abi.encodeWithSelector(DeployBioAgentRegistry.UnsupportedChain.selector, 1));
        deployScript.run();
    }

    function testRejectsZeroDeployer() public {
        vm.chainId(11155111);
        vm.expectRevert(DeployBioAgentRegistry.InvalidDeployer.selector);
        deployScript.deploy(address(0));
    }
}
