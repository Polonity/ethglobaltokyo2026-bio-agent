# BioAgent stimulus mailbox — experimental contract profile

2026-09-26. Unsubmitted, no EIP number assigned. See [design direction](bioagent-design-direction.md), [prior art](prior-art-and-bioagent.md), and [embodied learning profile](embodied-learning-profile.md) for the submission's main idea. This mailbox is transport, not BioAgent's biological contribution.

## Identity and compatibility

An agent is identified by `(chainId, registryAddress, agentId)`. `BioAgentRegistry` remains the existing owner-controlled foraging input registry. `BioAgentStimulusRegistry` derives from it and adds a schema-tagged mailbox. Neither is an NFT or SBT. Previously added tokenization experiments and their dependency have been removed.

`IBioAgent` retains Rest=0, Explore=1, Forage=2; energy/stimulus 0..10000; revision starts at 1 and increments on every accepted update; updatedAt is Unix seconds. Status means input conditions, not internal body state. Only registered owner can write. expectedRevision must match. This is a compatibility profile, not the universal activity enum.

## Mailbox semantics

`stimulusNonce(agentId)` starts at 0. `submitStimulus(agentId, expectedNonce, schema, payload)` requires the registered owner, a matching nonce, nonzero schema and 1..2048 payload bytes. It increments nonce and emits `BioAgentStimulusAccepted(agentId, nonce, schema, writer, keccak256(payload), payload)`. It does not modify the compatibility Status revision. Unknown agents revert. Failed calls make no state change.

The extension advertises ERC-165, IBioAgent, IBioAgentRegistry, IBioAgentWallet and IBioAgentStimulus separately. It does not advertise ERC-721, ERC-5192 or ERC-8004 compliance. The base Registry has no discovery extension.

Schema authors must define encoding, units, version, source validation, time and duplicate handling. The mailbox may accept an unknown schema; a runtime must reject a schema it cannot interpret. An accepted event proves only that this contract accepted the owner's bytes. It is not proof of source truth, runtime execution, learning or correctness.

Wallet references are owner-declared and do not confer execution or write authority. No controller transfer or delegation is implemented.

## Reference and validation

- `contracts/src/BioAgentStimulusRegistry.sol`, `interfaces/IBioAgentStimulus.sol`.
- `contracts/test/BioAgentStimulusRegistry.t.sol`: discovery, no token claim, envelope, replay, owner authorization, limits, unknown agents, payload fuzzing.
- `npm run demo:swaps`: three normal registered agents, synthetic V3-format source events, nine accepted stimuli and runtime reactions on a dedicated Anvil.

## Security and next decisions

Source receipt verification, confirmation/reorg handling, freshness and runtime acknowledgements remain outside this contract. Source payloads are public. Never publish secret memory or keys in them. Spot price is not a trade quote. Deadline/scoped authorization and complete descriptor/transition commitments require further design. See [application types](application-types.md). EIP authorship, canonical encoding, independent interoperability and community review remain pending. Do not call this an adopted ERC or audited system.

## Copyright

This specification is available under CC0; reference code is MIT.
