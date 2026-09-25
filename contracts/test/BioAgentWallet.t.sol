// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {Test} from "forge-std/Test.sol";
import {BioAgentRegistry} from "../src/BioAgentRegistry.sol";
import {IBioAgent} from "../src/interfaces/IBioAgent.sol";
import {IBioAgentWallet} from "../src/interfaces/IBioAgentWallet.sol";

contract BioAgentWalletTest is Test {
    BioAgentRegistry registry;
    address owner = address(0x1234);

    function setUp() public {
        registry = new BioAgentRegistry();
        vm.prank(owner);
        registry.registerAgent(bytes32(uint256(1)), "ipfs://test");
    }

    function testOwnerCanAssociateReplaceAndClearWithoutChangingStatus() public {
        assertEq(registry.getAgentWallet(1), address(0));
        vm.startPrank(owner);
        vm.expectEmit(true, true, true, true);
        emit IBioAgentWallet.BioAgentWalletUpdated(1, address(0), address(0x5678));
        registry.setAgentWallet(1, address(0x5678));
        assertEq(registry.getAgentWallet(1), address(0x5678));
        registry.setAgentWallet(1, address(0x9999));
        assertEq(registry.getAgentWallet(1), address(0x9999));
        registry.setAgentWallet(1, address(0));
        vm.stopPrank();
        assertEq(registry.getAgentWallet(1), address(0));
        assertEq(registry.getStatus(1).revision, 1);
        assertEq(registry.getAgent(1).owner, owner);
    }

    function testAssociationDoesNotGrantStatusWriteAuthority() public {
        vm.prank(owner);
        registry.setAgentWallet(1, address(this));
        vm.expectRevert(abi.encodeWithSelector(IBioAgent.UnauthorizedWriter.selector, 1, address(this)));
        registry.updateStatus(1, 1, IBioAgent.Activity.Rest, 0, 0);
        vm.expectRevert(abi.encodeWithSelector(IBioAgent.UnauthorizedWriter.selector, 1, address(this)));
        registry.setAgentWallet(1, address(0));
    }

    function testUnknownAgentRejected() public {
        vm.expectRevert(abi.encodeWithSelector(IBioAgent.AgentNotFound.selector, 2));
        registry.getAgentWallet(2);
        vm.expectRevert(abi.encodeWithSelector(IBioAgent.AgentNotFound.selector, 2));
        registry.setAgentWallet(2, owner);
    }
}
