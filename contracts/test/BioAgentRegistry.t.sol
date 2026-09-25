// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {Test} from "forge-std/Test.sol";
import {Vm} from "forge-std/Vm.sol";
import {BioAgentRegistry} from "../src/BioAgentRegistry.sol";
import {IBioAgent} from "../src/interfaces/IBioAgent.sol";
import {IBioAgentRegistry} from "../src/interfaces/IBioAgentRegistry.sol";

contract BioAgentRegistryTest is Test {
    BioAgentRegistry internal registry;
    address internal owner = makeAddr("owner");
    address internal stranger = makeAddr("stranger");
    bytes32 internal constant MODEL = 0xed2ab4c3845eab9249b270d49d3e0fc3ab44b8df79747c9b4b3b6348b9bdd166;
    string internal constant URI = "ipfs://demo-metadata";

    function setUp() public {
        registry = new BioAgentRegistry();
        vm.warp(1_800_000_000);
    }

    function register() internal returns (uint256 id) {
        vm.prank(owner);
        id = registry.registerAgent(MODEL, URI);
    }

    function testRegistrationStoresDefinitionAndInitialStatusWithOrderedEvents() public {
        vm.recordLogs();
        uint256 id = register();
        assertEq(id, 1);
        assertEq(registry.nextAgentId(), 2);
        IBioAgentRegistry.BioAgentDefinition memory agent = registry.getAgent(id);
        assertEq(agent.owner, owner);
        assertEq(agent.modelHash, MODEL);
        assertEq(agent.metadataURI, URI);
        IBioAgent.BioAgentStatus memory status = registry.getStatus(id);
        assertEq(uint8(status.activity), 0);
        assertEq(status.energy, 5000);
        assertEq(status.stimulus, 0);
        assertEq(status.revision, 1);
        assertEq(status.updatedAt, block.timestamp);
        Vm.Log[] memory logs = vm.getRecordedLogs();
        assertEq(logs.length, 2);
        assertEq(logs[0].emitter, address(registry));
        assertEq(logs[0].topics[0], keccak256("BioAgentRegistered(uint256,address,bytes32,string)"));
        assertEq(logs[0].topics[1], bytes32(id));
        assertEq(logs[0].topics[2], bytes32(uint256(uint160(owner))));
        assertEq(logs[0].topics[3], MODEL);
        assertEq(abi.decode(logs[0].data, (string)), URI);
        assertEq(
            logs[1].topics[0],
            keccak256("BioAgentStatusUpdated(uint256,uint64,address,uint8,uint16,uint16,uint64)")
        );
        assertEq(logs[1].topics[1], bytes32(id));
        assertEq(logs[1].topics[2], bytes32(uint256(1)));
        assertEq(logs[1].topics[3], bytes32(uint256(uint160(owner))));
        assertEq(
            logs[1].data,
            abi.encode(IBioAgent.Activity.Rest, uint16(5000), uint16(0), uint64(block.timestamp))
        );
    }

    function testUpdateEmitsFullStatusAndSameValuesCanRetrigger() public {
        uint256 id = register();
        vm.warp(1_800_000_007);
        vm.expectEmit(true, true, true, true, address(registry));
        emit IBioAgent.BioAgentStatusUpdated(
            id, 2, owner, IBioAgent.Activity.Forage, 8000, 9000, uint64(block.timestamp)
        );
        vm.prank(owner);
        registry.updateStatus(id, 1, IBioAgent.Activity.Forage, 8000, 9000);
        IBioAgent.BioAgentStatus memory status = registry.getStatus(id);
        assertEq(uint8(status.activity), 2);
        assertEq(status.energy, 8000);
        assertEq(status.stimulus, 9000);
        assertEq(status.revision, 2);
        assertEq(status.updatedAt, block.timestamp);
        vm.prank(owner);
        registry.updateStatus(id, 2, IBioAgent.Activity.Forage, 8000, 9000);
        assertEq(registry.getStatus(id).revision, 3);
    }

    function testAgentsHaveIndependentOwnersAndStatuses() public {
        uint256 first = register();
        vm.prank(stranger);
        uint256 second = registry.registerAgent(MODEL, URI);
        assertEq(second, 2);
        vm.prank(stranger);
        registry.updateStatus(second, 1, IBioAgent.Activity.Explore, 0, 10_000);
        assertEq(registry.getStatus(first).revision, 1);
        assertEq(registry.getStatus(first).energy, 5000);
        assertEq(registry.getAgent(second).owner, stranger);
    }

    function testUnauthorizedUpdateLeavesStateAndLogsUnchanged() public {
        uint256 id = register();
        vm.recordLogs();
        vm.expectRevert(abi.encodeWithSelector(IBioAgent.UnauthorizedWriter.selector, id, stranger));
        vm.prank(stranger);
        registry.updateStatus(id, 1, IBioAgent.Activity.Explore, 1, 1);
        assertEq(registry.getStatus(id).revision, 1);
        assertEq(vm.getRecordedLogs().length, 0);
    }

    function testStaleRevisionRejected() public {
        uint256 id = register();
        vm.prank(owner);
        registry.updateStatus(id, 1, IBioAgent.Activity.Explore, 10_000, 0);
        vm.expectRevert(abi.encodeWithSelector(IBioAgent.RevisionMismatch.selector, id, uint64(1), uint64(2)));
        vm.prank(owner);
        registry.updateStatus(id, 1, IBioAgent.Activity.Rest, 0, 0);
        assertEq(registry.getStatus(id).revision, 2);
    }

    function testUnknownAgentRejectedByAllAccessors() public {
        vm.expectRevert(abi.encodeWithSelector(IBioAgent.AgentNotFound.selector, 0));
        registry.getAgent(0);
        vm.expectRevert(abi.encodeWithSelector(IBioAgent.AgentNotFound.selector, 123));
        registry.getStatus(123);
        vm.expectRevert(abi.encodeWithSelector(IBioAgent.AgentNotFound.selector, 1));
        registry.updateStatus(1, 1, IBioAgent.Activity.Rest, 0, 0);
    }

    function testRegistrationValidationAndByteLength() public {
        vm.expectRevert(IBioAgentRegistry.InvalidModelHash.selector);
        registry.registerAgent(bytes32(0), URI);
        vm.expectRevert(abi.encodeWithSelector(IBioAgentRegistry.InvalidMetadataLength.selector, 0));
        registry.registerAgent(MODEL, "");
        vm.expectRevert(abi.encodeWithSelector(IBioAgentRegistry.InvalidMetadataLength.selector, 513));
        registry.registerAgent(MODEL, string(new bytes(513)));
        string memory multibyte = unicode"あ";
        for (uint256 i = 1; i < 171; ++i) {
            multibyte = string.concat(multibyte, unicode"あ");
        }
        vm.expectRevert(abi.encodeWithSelector(IBioAgentRegistry.InvalidMetadataLength.selector, 513));
        registry.registerAgent(MODEL, multibyte);
        assertEq(registry.nextAgentId(), 1);
        registry.registerAgent(MODEL, "x");
        registry.registerAgent(MODEL, string(new bytes(512)));
        assertEq(registry.nextAgentId(), 3);
    }

    function testOutOfRangeInputsAndInvalidActivityRejected() public {
        uint256 id = register();
        vm.startPrank(owner);
        vm.expectRevert(abi.encodeWithSelector(IBioAgent.InvalidEnergy.selector, uint16(10_001)));
        registry.updateStatus(id, 1, IBioAgent.Activity.Rest, 10_001, 0);
        vm.expectRevert(abi.encodeWithSelector(IBioAgent.InvalidStimulus.selector, uint16(10_001)));
        registry.updateStatus(id, 1, IBioAgent.Activity.Rest, 0, 10_001);
        // An out-of-range enum must be tested with raw ABI calldata.
        (bool ok,) = address(registry)
            .call(
                abi.encodeWithSelector(
                    IBioAgent.updateStatus.selector, id, uint64(1), uint8(3), uint16(0), uint16(0)
                )
            );
        assertFalse(ok);
        vm.stopPrank();
        assertEq(registry.getStatus(id).revision, 1);
    }

    function testFuzzValidInputsRoundTrip(uint8 activity, uint16 energy, uint16 stimulus) public {
        activity = uint8(bound(activity, 0, 2));
        energy = uint16(bound(energy, 0, 10_000));
        stimulus = uint16(bound(stimulus, 0, 10_000));
        uint256 id = register();
        vm.prank(owner);
        registry.updateStatus(id, 1, IBioAgent.Activity(activity), energy, stimulus);
        IBioAgent.BioAgentStatus memory status = registry.getStatus(id);
        assertEq(uint8(status.activity), activity);
        assertEq(status.energy, energy);
        assertEq(status.stimulus, stimulus);
        assertEq(status.revision, 2);
    }

    function testFuzzNonOwnerCannotWrite(address writer) public {
        vm.assume(writer != owner);
        uint256 id = register();
        vm.expectRevert(abi.encodeWithSelector(IBioAgent.UnauthorizedWriter.selector, id, writer));
        vm.prank(writer);
        registry.updateStatus(id, 1, IBioAgent.Activity.Rest, 0, 0);
    }
}
