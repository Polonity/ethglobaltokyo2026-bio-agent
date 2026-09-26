// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {Test} from "forge-std/Test.sol";
import {DeployLocalArena} from "../script/DeployLocalArena.s.sol";
import {BioAgentRegistry} from "../src/BioAgentRegistry.sol";
import {IBioAgent} from "../src/interfaces/IBioAgent.sol";

contract DeployLocalArenaTest is Test {
    function testThreeAgentsOwnedByLocalAccountAndWritableThroughIBioAgent() public {
        vm.chainId(31337);
        vm.setEnv("DEPLOYER_ADDRESS", "0x000000000000000000000000000000000000bEEF");
        vm.setEnv("LOCAL_MODEL_HASH", "0x1111111111111111111111111111111111111111111111111111111111111111");
        vm.setEnv("LOCAL_GUI_URL", "http://127.0.0.1:8798");
        vm.setEnv("LOCAL_WORLD_INPUT", "{\"world\":\"local-test\"}");
        BioAgentRegistry registry = new DeployLocalArena().run();
        assertEq(registry.nextAgentId(), 4);
        for (uint256 id = 1; id <= 3; id++) {
            assertEq(registry.getAgent(id).owner, address(0xBEEF));
            assertEq(registry.getStatus(id).revision, 1);
        }
        vm.prank(address(0xBEEF));
        IBioAgent(address(registry)).updateStatus(2, 1, IBioAgent.Activity.Explore, 7500, 6600);
        assertEq(registry.getStatus(2).stimulus, 6600);
        assertEq(registry.getStatus(1).revision, 1);
        assertEq(registry.getStatus(3).revision, 1);
    }

    function testLocalBootstrapRejectsSepolia() public {
        vm.chainId(11155111);
        DeployLocalArena script = new DeployLocalArena();
        vm.expectRevert(abi.encodeWithSelector(DeployLocalArena.NotLocalChain.selector, 11155111));
        script.run();
    }
}
