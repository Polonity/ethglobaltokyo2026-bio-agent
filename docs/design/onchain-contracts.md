# IBioAgent, registry, Status, and events

The Solidity interfaces and Foundry tests define the exact types and errors: [IBioAgent](../../contracts/src/interfaces/IBioAgent.sol), [IBioAgentRegistry](../../contracts/src/interfaces/IBioAgentRegistry.sol). For deployment status, see the [current record](../deployment/sepolia.md).

## Identity and responsibility

`BioAgentRegistry` implements the common onchain contract and stores a definition and latest Status per `agentId`. Agents are registry records, not individual contract addresses. IDs start at 1; zero means unregistered. Cross-chain identity must include chainId and registry address. Registration does not prove that a runtime is running.

## Types

```solidity
interface IBioAgent {
    enum Activity { Rest, Explore, Forage }

    struct BioAgentStatus {
        Activity activity;
        uint16 energy;       // 0..10000: normalized demo input
        uint16 stimulus;     // 0..10000: stimulus intensity
        uint64 revision;     // assigned by contract; initially 1
        uint64 updatedAt;    // block.timestamp assigned by contract
    }

    event BioAgentStatusUpdated(
        uint256 indexed agentId,
        uint64 indexed revision,
        address indexed writer,
        Activity activity,
        uint16 energy,
        uint16 stimulus,
        uint64 updatedAt
    );

    function getStatus(uint256 agentId)
        external view returns (BioAgentStatus memory);

    function updateStatus(
        uint256 agentId,
        uint64 expectedRevision,
        Activity activity,
        uint16 energy,
        uint16 stimulus
    ) external;
}

interface IBioAgentRegistry is IBioAgent {
    struct BioAgentDefinition {
        address owner;
        bytes32 modelHash;  // SHA-256 of the model bundle manifest
        string metadataURI;
    }

    event BioAgentRegistered(
        uint256 indexed agentId,
        address indexed owner,
        bytes32 indexed modelHash,
        string metadataURI
    );

    function registerAgent(bytes32 modelHash, string calldata metadataURI)
        external returns (uint256 agentId);

    function getAgent(uint256 agentId)
        external view returns (BioAgentDefinition memory);
}
```

This excerpt omits custom errors. `contracts/abi/`, generated from Solidity source, is the public ABI authority. The interface does not imply tokenization or compliance with an EIP/ERC.

## Registration and updates

| Operation | Validation | Result |
| --- | --- | --- |
| registerAgent | Nonzero modelHash; metadataURI 1–512 bytes, without UTF-8 validation | owner=msg.sender; initial Rest / energy 5000 / stimulus 0 / revision 1; Registered then StatusUpdated in the same TX |
| updateStatus | Registered agent, owner caller, values 0–10000, matching expectedRevision | Replace Status, increment revision, emit one StatusUpdated |
| getAgent / getStatus | Registered agent | Latest value; unknown ID reverts |

Definitions are immutable in v0.1; a different model requires another registration. Repeating the same values still creates a new revision, allowing repeated stimulation. Conflicts and revision overflow revert. The GUI refreshes before retrying a conflict. Distinct custom errors cover authority, unknown IDs, ranges, and revisions. Invalid enum values are rejected, including during ABI decoding. Contracts do not fetch or verify URI contents.

## Status versus RuntimeState

| | Onchain BioAgentStatus | Offchain RuntimeState |
| --- | --- | --- |
| Meaning | Owner-supplied conditions/stimuli | Computed state and action |
| Examples | Forage, energy 8000, stimulus 9000 | Position, heading, speed, activation, selected action |
| Update frequency | Per submitted input | Per simulation tick |
| Writer | Owner wallet | Running agent runtime |

Activity is context, not a movement coordinate. Its interpretation belongs to the model version/manifest. A Status record is neither a biological measurement nor proof of execution.

## Models and metadata

A manifest records schemaVersion, model kind, circuit version/hash, weight hashes, normalization, action outputs, runtime version, and replay seed policy. In this design, modelHash is SHA-256 of the **exact published manifest bytes**, which in turn record artifact hashes.

metadataURI points to name, description, and manifest location. A runtime verifies manifest/artifact hashes and refuses unsupported or mismatched models. It maps to installed implementations rather than executing arbitrary code from a URI.

## Events and provenance

StatusUpdated contains the whole revision, not a delta. Process historical log values directly; replacing them with `getStatus(latest)` loses the original input. Initial registration uses the same Status event.

Indexed ABI arguments become log topics for filtering by agent ID or event signature. See the [Solidity event ABI](https://docs.soliditylang.org/en/latest/abi-spec.html#events).

Version ABI, address, deployment block, and chainId together. Incompatible changes require a new registry; v0.1 does not use an upgradeable proxy.
