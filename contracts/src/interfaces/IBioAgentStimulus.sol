// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

/// @notice Experimental, schema-tagged input mailbox. Acceptance is not execution or truth verification.
interface IBioAgentStimulus {
    error InvalidStimulusEnvelope();
    error StimulusNonceMismatch(uint256 expected, uint256 actual);
    event BioAgentStimulusAccepted(
        uint256 indexed agentId,
        uint256 indexed nonce,
        bytes32 indexed schema,
        address writer,
        bytes32 payloadHash,
        bytes payload
    );
    function stimulusNonce(uint256 agentId) external view returns (uint256);
    function submitStimulus(uint256 agentId, uint256 expectedNonce, bytes32 schema, bytes calldata payload)
        external;
}
