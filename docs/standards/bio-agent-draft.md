# Bio Agent Stimulus Interface — preliminary ERC proposal

Working draft, 2026-09-26. **Unsubmitted; no EIP number assigned.** This is a reviewable specification and reference implementation, not an accepted Ethereum standard or audited contract. Before submission, authors must supply their identity, discussion URL and required EIP front matter. Proposed category: Standards Track / ERC. License: CC0 for this document; reference code remains MIT.

## Abstract

Define a schema-tagged input mailbox for independently identified agents, with explicit writer authority, optimistic concurrency and event-based consumption. Identity ownership, input acceptance, runtime execution, model learning and economic settlement are separate concerns. An accepted stimulus does not attest to its source or its effect.

## Motivation

Games and other agent applications need a portable way to associate stimuli with an agent without standardizing a particular neural architecture. Bio Agent demonstrates two consumers: foraging and market observation. Neither successful learning nor biological fidelity is implied by an interface implementation.

## Specification

The keywords MUST, MUST NOT, SHOULD and MAY are normative. The v0 experimental profile below is implemented; interfaces can still change before any submission.

### Identity and discovery

An agent MUST be addressed by `(chainId, registryAddress, agentId)`, not by tokenId alone. The NFT profile MUST implement ERC-165, ERC-721 and ERC-721 metadata. `agentId == tokenId`, `getAgent(id).owner == ownerOf(id)`, and `tokenURI(id) == getAgent(id).metadataURI`. Unknown IDs MUST revert. IDs start at 1 and MUST NOT be reused. Metadata URI and model manifest SHA-256 are immutable in this reference implementation; URI contents are not guaranteed immutable or available.

Consumers MUST separately discover `IBioAgent`, `IBioAgentRegistry`, `IBioAgentWallet` and `IBioAgentStimulus` with ERC-165. Solidity interface IDs exclude inherited functions; discovery of the registry alone MUST NOT be taken as discovery of its inherited status interface. Exact interfaces and exported ABIs live in `contracts/src/interfaces` and `contracts/abi`.

### Compatibility status profile

`IBioAgent` is retained byte-for-byte: Rest=0, Explore=1, Forage=2; energy and stimulus are integers 0..10000; revision starts at 1, increases on every successful update, including identical values; updatedAt is block Unix time in seconds. Only the current owner MAY call `updateStatus`. A mismatched expectedRevision MUST revert without changing storage or emitting an update. `BioAgentStatusUpdated` carries the full resulting input. It MUST NOT be interpreted as a runtime result.

The three activity values are a **foraging-specific compatibility profile**, not a universal ontology for every agent. New applications SHOULD use schema-tagged stimuli instead of adding trading values to this enum.

### Schema-tagged stimuli

Canonical signature:

```solidity
function stimulusNonce(uint256 agentId) external view returns (uint256);
function submitStimulus(uint256 agentId, uint256 expectedNonce, bytes32 schema, bytes calldata payload) external;
event BioAgentStimulusAccepted(
    uint256 indexed agentId, uint256 indexed nonce, bytes32 indexed schema,
    address writer, bytes32 payloadHash, bytes payload
);
```

Nonce starts at 0. Only current owner MAY submit; NFT approvals and wallet association MUST NOT grant stimulus authority. expectedNonce MUST equal the current nonce. Schema MUST be nonzero; payload MUST contain 1..2048 bytes. Successful submission increments the nonce and emits exactly one acceptance event, with `keccak256(payload)` and the complete bytes. Contract storage keeps only the nonce. Unknown schema bytes MAY be accepted by the mailbox; a runtime MUST reject schemas it does not implement.

Each schema specification MUST define byte encoding, field units, source identity, version, freshness, ordering, and validation. A schema identifier SHOULD be the Keccak-256 of its versioned canonical name. Hash equality is integrity, not proof of source truth. The reference contract does not verify a Uniswap receipt or enforce a trading action.

### Transferable NFT profile

`BioAgentNFT` implements ERC-721 using pinned OpenZeppelin 5.4.0. Registration mints to the caller without receiver callback; contract callers are responsible for accepting custody. Safe transfers use the standard receiver callback. ERC-721 approvals permit transfer only; status, stimulus and wallet writes remain owner-only.

Every transfer, including self-transfer, MUST clear the wallet reference, increment stimulus nonce, and reset status to `(Rest, 5000, 0)` with a new revision. All effects occur before receiver callback. Emit Transfer, BioAgentWalletUpdated and BioAgentStatusUpdated, in that order. Consumers MUST treat Transfer as an authority boundary and read the new nonce; nonce gaps are expected. A pending stimulus transaction with an old nonce cannot be accepted after transfer. A runtime MUST discard unexecuted inputs from the preceding ownership period and pause for fresh instructions. Already performed external actions cannot be undone by NFT transfer.

### Soulbound profile

`BioAgentSBT` adds ERC-5192 discovery (`0xb45a3c0e`). `locked(id)` MUST return true for existing IDs and revert for unknown IDs. Mint MUST emit Locked. All transfer overloads MUST revert while locked, including approved operators and self-transfer. This profile has no unlock, burn or recovery. Approval calls may succeed but cannot bypass the lock or authorize inputs. Registration is self-minting; issuer-attested credentials and consent are not implemented.

### Wallet association

`IBioAgentWallet` stores an optional same-chain address. Zero means absent. The association MUST be presented as owner-declared, not proof of control, account deployment or delegation. Transferring the NFT does not transfer custody of any referenced account. Token-bound account ownership is a separate profile and is not implemented here.

## Rationale and existing standards

Reuse [ERC-721](https://eips.ethereum.org/EIPS/eip-721) for asset ownership and [ERC-5192](https://eips.ethereum.org/EIPS/eip-5192) for minimal lock discovery. [ERC-6551](https://eips.ethereum.org/EIPS/eip-6551) is a possible account integration, not a synonym for storing a wallet address.

[ERC-8004](https://eips.ethereum.org/EIPS/eip-8004) already covers agent discovery and trust registries. Bio Agent's potential contribution is the input lifecycle. The current NFT profile does **not** implement ERC-8004 registration, reputation or wallet-control proofs, and MUST NOT advertise ERC-8004 compliance. An adapter to an existing identity registry may be preferable to standardizing another registry. This is an open design question for external review.

## Backwards compatibility

Existing BioAgentRegistry deployment and ABI retain nontransferable registration behavior, but are not ERC-721 or ERC-5192 tokens. New NFT/SBT contracts are opt-in separate deployments; there is no proxy upgrade or automatic migration. Their identity tuples differ from old deployments even when tokenIds match. Existing GUI/bootstrap still use the original Registry.

## Reference implementation and test cases

- `contracts/src/BioAgentNFT.sol`, `BioAgentSBT.sol`, `interfaces/IBioAgentStimulus.sol`.
- `contracts/test/BioAgentProfiles.t.sol`: discovery, metadata, ownership consistency, transfer reset, old-owner rejection, operator boundaries, input replay/bounds, receiver callback atomicity, rejected receiver rollback, all SBT transfer overloads, fuzz payloads.
- Run `npm ci`, then `forge test --root contracts`. Foundry is pinned to v1.8.3 in CI.

## Security considerations

On-chain events do not automatically execute a runtime. Consumers must verify network, emitter, receipt success, canonical block hash and confirmation policy; deduplicate by chain/emitter/blockHash/txHash/logIndex; rollback on reorg and reject stale inputs. Owner-submitted market data is untrusted unless independently verified against a configured pool. Spot pool price is manipulable and is not an execution quote or safe oracle. Public payloads leak inputs; payload caps limit per-call size, not transaction frequency. Contract-owner receiver reentrancy cannot bypass current-owner checks but can initiate further authorized actions. Model content availability, malicious runtime code, account permissions, replay storage and leaderboard honesty remain separate responsibilities.

## Open issues before EIP submission

1. Obtain community review under [EIP-1](https://eips.ethereum.org/EIPS/eip-1); authorship, discussion link and eventual number are not assigned by this repo.
2. Decide whether the mailbox targets external ERC-8004 identities or co-resident ERC-721 tokens.
3. Specify optional scoped delegation with expiry/revocation, and signed submissions with chain/contract/ownership-domain separation.
4. Define runtime acknowledgements, model/checkpoint commitments, and what independent validation proves.
5. Review mint receiver behavior, transfer invalidation, SBT consent/recovery and schema registry governance.
6. Publish independent interoperability tests and obtain security review; current project tests are not certification.

## Copyright

Copyright and related rights waived via CC0 for this specification.
