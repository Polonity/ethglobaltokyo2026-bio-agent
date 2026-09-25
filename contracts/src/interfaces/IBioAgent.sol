// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

/// @notice On-chain input contract for an off-chain Bio Agent runtime.
interface IBioAgent {
    enum Activity {
        Rest,
        Explore,
        Forage
    }

    struct BioAgentStatus {
        Activity activity;
        uint16 energy;
        uint16 stimulus;
        uint64 revision;
        uint64 updatedAt;
    }

    error AgentNotFound(uint256 agentId);
    error UnauthorizedWriter(uint256 agentId, address writer);
    error InvalidEnergy(uint16 value);
    error InvalidStimulus(uint16 value);
    error RevisionMismatch(uint256 agentId, uint64 expected, uint64 actual);

    event BioAgentStatusUpdated(
        uint256 indexed agentId,
        uint64 indexed revision,
        address indexed writer,
        Activity activity,
        uint16 energy,
        uint16 stimulus,
        uint64 updatedAt
    );

    function getStatus(uint256 agentId) external view returns (BioAgentStatus memory);

    /// @notice Updates input conditions, not the runtime's computed state.
    /// @param expectedRevision Current revision, used to reject stale writes.
    function updateStatus(
        uint256 agentId,
        uint64 expectedRevision,
        Activity activity,
        uint16 energy,
        uint16 stimulus
    ) external;
}
