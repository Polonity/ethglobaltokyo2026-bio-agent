// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {Test} from "forge-std/Test.sol";
import {BioAgentStimulusRegistry} from "../src/BioAgentStimulusRegistry.sol";
import {IBioAgentStimulus} from "../src/interfaces/IBioAgentStimulus.sol";

contract BioAgentStimulusRegistryTest is Test {
    BioAgentStimulusRegistry registry;
    bytes32 schema = keccak256("bioagent.market.v1");

    function setUp() public {
        registry = new BioAgentStimulusRegistry();
        registry.registerAgent(bytes32(uint256(1)), "ipfs://agent");
    }

    function testDiscoveryDoesNotClaimNFT() public view {
        assertTrue(registry.supportsInterface(0x01ffc9a7));
        assertTrue(registry.supportsInterface(type(IBioAgentStimulus).interfaceId));
        assertFalse(registry.supportsInterface(0x80ac58cd));
        assertFalse(registry.supportsInterface(0xffffffff));
    }

    function testEnvelopeAndReplay() public {
        vm.expectEmit(true, true, true, true);
        emit IBioAgentStimulus.BioAgentStimulusAccepted(
            1, 1, schema, address(this), keccak256(hex"abcd"), hex"abcd"
        );
        registry.submitStimulus(1, 0, schema, hex"abcd");
        vm.expectRevert();
        registry.submitStimulus(1, 0, schema, hex"abcd");
        assertEq(registry.stimulusNonce(1), 1);
        assertEq(registry.getStatus(1).revision, 1);
    }

    function testRejectUnauthorizedAndInvalidPayloads() public {
        vm.prank(address(1));
        vm.expectRevert();
        registry.submitStimulus(1, 0, schema, hex"01");
        vm.expectRevert();
        registry.submitStimulus(2, 0, schema, hex"01");
        vm.expectRevert();
        registry.submitStimulus(1, 0, bytes32(0), hex"01");
        vm.expectRevert();
        registry.submitStimulus(1, 0, schema, "");
        vm.expectRevert();
        registry.submitStimulus(1, 0, schema, new bytes(2049));
        assertEq(registry.stimulusNonce(1), 0);
    }

    function testFuzzPayload(bytes calldata payload) public {
        vm.assume(payload.length > 0 && payload.length <= 2048);
        registry.submitStimulus(1, 0, schema, payload);
        assertEq(registry.stimulusNonce(1), 1);
    }
}
