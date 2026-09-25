// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {IBioAgent} from "./IBioAgent.sol";

interface IBioAgentRegistry is IBioAgent {
    struct BioAgentDefinition {
        address owner;
        bytes32 modelHash;
        string metadataURI;
    }

    error InvalidModelHash();
    error InvalidMetadataLength(uint256 length);

    event BioAgentRegistered(
        uint256 indexed agentId, address indexed owner, bytes32 indexed modelHash, string metadataURI
    );

    /// @param modelHash SHA-256 of the exact bytes of the model manifest.
    /// @param metadataURI Metadata location, 1..512 bytes; contents are not validated on-chain.
    function registerAgent(bytes32 modelHash, string calldata metadataURI) external returns (uint256 agentId);

    function getAgent(uint256 agentId) external view returns (BioAgentDefinition memory);
}
