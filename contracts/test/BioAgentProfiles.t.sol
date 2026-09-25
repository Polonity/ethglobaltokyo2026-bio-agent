// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {Test} from "forge-std/Test.sol";
import {IERC721Receiver} from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import {BioAgentNFT} from "../src/BioAgentNFT.sol";
import {BioAgentSBT} from "../src/BioAgentSBT.sol";
import {IBioAgent} from "../src/interfaces/IBioAgent.sol";
import {IBioAgentStimulus} from "../src/interfaces/IBioAgentStimulus.sol";

contract BioAgentProfilesTest is Test, IERC721Receiver {
    BioAgentNFT nft;
    address alice = address(0xa11ce);
    address bob = address(0xb0b);
    bytes32 schema = keccak256("bioagent.market.v1");

    function setUp() public {
        nft = new BioAgentNFT();
        vm.prank(alice);
        nft.registerAgent(bytes32(uint256(1)), "ipfs://agent");
    }

    function testDiscoveryAndMetadata() public view {
        assertTrue(nft.supportsInterface(0x80ac58cd));
        assertTrue(nft.supportsInterface(0x01ffc9a7));
        assertTrue(nft.supportsInterface(0x5b5e139f));
        assertTrue(nft.supportsInterface(type(IBioAgent).interfaceId));
        assertTrue(nft.supportsInterface(type(IBioAgentStimulus).interfaceId));
        assertFalse(nft.supportsInterface(0xffffffff));
        assertEq(nft.ownerOf(1), nft.getAgent(1).owner);
        assertEq(nft.balanceOf(alice), 1);
        assertEq(nft.tokenURI(1), "ipfs://agent");
    }

    function testTransferClearsWalletAndResetsInputsAndAuthority() public {
        vm.startPrank(alice);
        nft.setAgentWallet(1, bob);
        nft.updateStatus(1, 1, IBioAgent.Activity.Forage, 9000, 8000);
        nft.submitStimulus(1, 0, schema, hex"01");
        nft.transferFrom(alice, bob, 1);
        vm.expectRevert();
        nft.updateStatus(1, 3, IBioAgent.Activity.Rest, 0, 0);
        vm.expectRevert();
        nft.submitStimulus(1, 2, schema, hex"01");
        vm.stopPrank();
        assertEq(nft.getAgent(1).owner, bob);
        assertEq(nft.getAgentWallet(1), address(0));
        assertEq(nft.getStatus(1).revision, 3);
        assertEq(uint8(nft.getStatus(1).activity), 0);
        assertEq(nft.stimulusNonce(1), 2);
        vm.prank(bob);
        nft.submitStimulus(1, 2, schema, hex"02");
    }

    function testOperatorCanTransferButCannotWriteInputs() public {
        vm.prank(alice);
        nft.setApprovalForAll(bob, true);
        vm.startPrank(bob);
        vm.expectRevert();
        nft.submitStimulus(1, 0, schema, hex"01");
        vm.expectRevert();
        nft.setAgentWallet(1, bob);
        vm.expectRevert();
        nft.updateStatus(1, 1, IBioAgent.Activity.Rest, 0, 0);
        nft.transferFrom(alice, bob, 1);
        vm.stopPrank();
    }

    function testEnvelopeAndNonce() public {
        vm.startPrank(alice);
        vm.expectEmit(true, true, true, true);
        emit IBioAgentStimulus.BioAgentStimulusAccepted(1, 1, schema, alice, keccak256(hex"abcd"), hex"abcd");
        nft.submitStimulus(1, 0, schema, hex"abcd");
        vm.expectRevert(abi.encodeWithSelector(IBioAgentStimulus.StimulusNonceMismatch.selector, 0, 1));
        nft.submitStimulus(1, 0, schema, hex"abcd");
        vm.expectRevert(IBioAgentStimulus.InvalidStimulusEnvelope.selector);
        nft.submitStimulus(1, 1, bytes32(0), hex"01");
        vm.expectRevert(IBioAgentStimulus.InvalidStimulusEnvelope.selector);
        nft.submitStimulus(1, 1, schema, "");
        vm.expectRevert(IBioAgentStimulus.InvalidStimulusEnvelope.selector);
        nft.submitStimulus(1, 1, schema, new bytes(2049));
        vm.stopPrank();
        assertEq(nft.stimulusNonce(1), 1);
    }

    function testSafeTransferChecksReceiverAndAtomicState() public {
        vm.prank(alice);
        nft.safeTransferFrom(alice, address(this), 1);
        assertEq(nft.ownerOf(1), address(this));
    }

    function onERC721Received(address, address, uint256 tokenId, bytes calldata)
        external
        view
        returns (bytes4)
    {
        assertEq(nft.getAgent(tokenId).owner, address(this));
        assertEq(nft.getStatus(tokenId).revision, 2);
        return IERC721Receiver.onERC721Received.selector;
    }

    function testRejectUnsafeReceiver() public {
        vm.prank(alice);
        vm.expectRevert();
        nft.safeTransferFrom(alice, address(nft), 1);
        assertEq(nft.ownerOf(1), alice);
        assertEq(nft.getStatus(1).revision, 1);
    }

    function testSoulboundAllTransferOverloads() public {
        BioAgentSBT sbt = new BioAgentSBT();
        vm.startPrank(alice);
        sbt.registerAgent(bytes32(uint256(1)), "ipfs://sbt");
        assertTrue(sbt.supportsInterface(0xb45a3c0e));
        assertTrue(sbt.locked(1));
        vm.expectRevert();
        sbt.locked(2);
        vm.expectRevert(abi.encodeWithSelector(BioAgentSBT.Soulbound.selector, 1));
        sbt.transferFrom(alice, bob, 1);
        vm.expectRevert();
        sbt.safeTransferFrom(alice, bob, 1);
        vm.expectRevert();
        sbt.safeTransferFrom(alice, bob, 1, hex"01");
        sbt.approve(bob, 1);
        vm.stopPrank();
        vm.prank(bob);
        vm.expectRevert();
        sbt.transferFrom(alice, bob, 1);
        assertEq(sbt.ownerOf(1), alice);
    }

    function testFuzzStimulusPayload(bytes calldata payload) public {
        vm.assume(payload.length > 0 && payload.length <= 2048);
        vm.prank(alice);
        nft.submitStimulus(1, 0, schema, payload);
        assertEq(nft.stimulusNonce(1), 1);
    }
}
