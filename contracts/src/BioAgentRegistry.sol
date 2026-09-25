// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {IBioAgentWallet} from "./interfaces/IBioAgentWallet.sol";

import {IBioAgentRegistry} from "./interfaces/IBioAgentRegistry.sol";

/// @notice Immutable agent definitions and owner-controlled input status.
/// @dev No proxy, admin, external calls, or automatic runtime execution.
contract BioAgentRegistry is IBioAgentRegistry, IBioAgentWallet {
    uint256 public constant MAX_METADATA_BYTES = 512;
    uint16 public constant MAX_INPUT = 10_000;
    uint256 public nextAgentId = 1;

    mapping(uint256 agentId => address) internal _wallets;

    mapping(uint256 agentId => BioAgentDefinition) internal _agents;
    mapping(uint256 agentId => BioAgentStatus) internal _statuses;

    function registerAgent(bytes32 modelHash, string calldata metadataURI)
        external
        virtual
        override
        returns (uint256 agentId)
    {
        if (modelHash == bytes32(0)) revert InvalidModelHash();
        uint256 length = bytes(metadataURI).length;
        if (length == 0 || length > MAX_METADATA_BYTES) revert InvalidMetadataLength(length);

        agentId = nextAgentId++;
        _agents[agentId] = BioAgentDefinition(msg.sender, modelHash, metadataURI);
        // Unix seconds fit uint64 for more than 500 billion years.
        // forge-lint: disable-next-line(unsafe-typecast)
        uint64 timestamp = uint64(block.timestamp);
        _statuses[agentId] = BioAgentStatus(Activity.Rest, 5000, 0, 1, timestamp);

        _afterRegistration(agentId);
        emit BioAgentRegistered(agentId, msg.sender, modelHash, metadataURI);
        emit BioAgentStatusUpdated(agentId, 1, msg.sender, Activity.Rest, 5000, 0, timestamp);
    }

    function getAgent(uint256 agentId) external view override returns (BioAgentDefinition memory) {
        _requireAgent(agentId);
        return _agents[agentId];
    }

    function getStatus(uint256 agentId) external view override returns (BioAgentStatus memory) {
        _requireAgent(agentId);
        return _statuses[agentId];
    }

    function updateStatus(
        uint256 agentId,
        uint64 expectedRevision,
        Activity activity,
        uint16 energy,
        uint16 stimulus
    ) external override {
        _requireAgent(agentId);
        if (msg.sender != _agents[agentId].owner) revert UnauthorizedWriter(agentId, msg.sender);
        if (energy > MAX_INPUT) revert InvalidEnergy(energy);
        if (stimulus > MAX_INPUT) revert InvalidStimulus(stimulus);

        uint64 currentRevision = _statuses[agentId].revision;
        if (expectedRevision != currentRevision) {
            revert RevisionMismatch(agentId, expectedRevision, currentRevision);
        }
        uint64 revision = currentRevision + 1;
        // Unix seconds fit uint64 for more than 500 billion years.
        // forge-lint: disable-next-line(unsafe-typecast)
        uint64 timestamp = uint64(block.timestamp);
        _statuses[agentId] = BioAgentStatus(activity, energy, stimulus, revision, timestamp);
        emit BioAgentStatusUpdated(agentId, revision, msg.sender, activity, energy, stimulus, timestamp);
    }

    /// @notice Optional same-chain wallet reference. Zero means not configured.
    /// @dev No wallet deployment, verification, approval, or delegation takes place here.
    function getAgentWallet(uint256 agentId) external view override returns (address) {
        _requireAgent(agentId);
        return _wallets[agentId];
    }

    function setAgentWallet(uint256 agentId, address smartWallet) external override {
        _requireAgent(agentId);
        if (msg.sender != _agents[agentId].owner) revert UnauthorizedWriter(agentId, msg.sender);
        address previous = _wallets[agentId];
        _wallets[agentId] = smartWallet;
        emit BioAgentWalletUpdated(agentId, previous, smartWallet);
    }

    function _afterRegistration(uint256 agentId) internal virtual {}

    function _requireAgent(uint256 agentId) internal view {
        if (_agents[agentId].owner == address(0)) revert AgentNotFound(agentId);
    }
}
