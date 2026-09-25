// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {BioAgentRegistry} from "./BioAgentRegistry.sol";
import {IBioAgent} from "./interfaces/IBioAgent.sol";
import {IBioAgentRegistry} from "./interfaces/IBioAgentRegistry.sol";
import {IBioAgentWallet} from "./interfaces/IBioAgentWallet.sol";
import {IBioAgentStimulus} from "./interfaces/IBioAgentStimulus.sol";

/// @notice Agent registry with an optional schema-tagged input mailbox; no tokenization.
contract BioAgentStimulusRegistry is BioAgentRegistry, IBioAgentStimulus {
    uint256 public constant MAX_PAYLOAD_BYTES = 2048;
    mapping(uint256 => uint256) internal _stimulusNonces;

    function supportsInterface(bytes4 id) external pure returns (bool) {
        return id == 0x01ffc9a7 || id == type(IBioAgent).interfaceId
            || id == type(IBioAgentRegistry).interfaceId || id == type(IBioAgentWallet).interfaceId
            || id == type(IBioAgentStimulus).interfaceId;
    }

    function stimulusNonce(uint256 agentId) external view returns (uint256) {
        _requireAgent(agentId);
        return _stimulusNonces[agentId];
    }

    function submitStimulus(uint256 agentId, uint256 expectedNonce, bytes32 schema, bytes calldata payload)
        external
    {
        _requireAgent(agentId);
        if (msg.sender != _agents[agentId].owner) revert UnauthorizedWriter(agentId, msg.sender);
        uint256 current = _stimulusNonces[agentId];
        if (expectedNonce != current) revert StimulusNonceMismatch(expectedNonce, current);
        if (schema == bytes32(0) || payload.length == 0 || payload.length > MAX_PAYLOAD_BYTES) {
            revert InvalidStimulusEnvelope();
        }
        uint256 nonce = current + 1;
        _stimulusNonces[agentId] = nonce;
        emit BioAgentStimulusAccepted(agentId, nonce, schema, msg.sender, keccak256(payload), payload);
    }
}
