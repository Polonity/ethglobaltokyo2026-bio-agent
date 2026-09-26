# BioAgent and existing ERC boundaries

Research snapshot: 2026-09-26. This is a primary-source design review, not exhaustive prior-art or novelty proof. Drafts may change; out of scope for a cited specification does not mean absent from all projects. See [additional rationale](why-bioagent.md).

## Position

Propose an interoperable profile relating measured structure, body state, and experience to provenance-bearing stimuli and reviewable histories. Identity/ownership and wallet execution authority remain separate. Learning/state/replay are general AI needs; the additional semantics concern biological origin, sensory/motor mappings, body feedback, and plasticity location.

| Specification                                                                                        | Subject                                                     | Project treatment                                                                                          |
| ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| [ERC-721](https://eips.ethereum.org/EIPS/eip-721), [ERC-165](https://eips.ethereum.org/EIPS/eip-165) | Ownership/transfer; interface discovery                     | Prior art, not mandatory tokenization                                                                      |
| [ERC-5192](https://eips.ethereum.org/EIPS/eip-5192)                                                  | NFT lock state                                              | Extension example, not required BioAgent functionality                                                     |
| [ERC-5484](https://eips.ethereum.org/EIPS/eip-5484)                                                  | Consent and immutable burn authorization                    | Credential/SBT issuance outside scope                                                                      |
| [ERC-6551](https://eips.ethereum.org/EIPS/eip-6551)                                                  | NFT-bound accounts                                          | Separate assets from decisions; a wallet reference is not compliance                                       |
| [ERC-8004](https://eips.ethereum.org/EIPS/eip-8004)                                                  | Identity/reputation/validation registries (Draft at review) | Candidate identity integration; current contracts do not conform                                           |
| [ERC-7857](https://eips.ethereum.org/EIPS/eip-7857)                                                  | Private metadata and verified data transfer                 | Possible private-checkpoint transfer; token transfer alone does not deliver state                          |
| [ERC-8350](https://eips.ethereum.org/EIPS/eip-8350)                                                  | Authorized memory-state commitments (Draft at review)       | Possible history binding, not implemented                                                                  |
| [ERC-7007](https://eips.ethereum.org/EIPS/eip-7007)                                                  | Generated-output/input/model verification                   | Output proof differs from biological/learning validity; not implemented                                    |
| [ERC-4906](https://eips.ethereum.org/EIPS/eip-4906)                                                  | Metadata-update notification                                | Possible committed appearance snapshots, not frame updates                                                 |
| [ERC-7496](https://eips.ethereum.org/EIPS/eip-7496)                                                  | Dynamic onchain traits (Draft at review)                    | A stored belly trait alone is not a body model; time-varying hunger is not automatically an onchain update |
| [ERC-8001](https://eips.ethereum.org/EIPS/eip-8001)                                                  | Multi-agent intents/approval                                | Optional future coordination; sensory input is not consent to trade                                        |

Candidates require separate contract/signature/authority/data-format conformance checks.

## Six semantic responsibilities

| Responsibility                    | Minimum record                                                                                    | Failure avoided                                         |
| --------------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| Biological provenance/assumptions | Dataset/digest, extraction, graph, dynamics, license, scoped claims                               | Calling synthetic Q-learning MaleCNS execution          |
| Sensory/motor mapping             | Adapter version, units, normalization, channels/cells, decoder                                    | Calling an external price→buy rule a neural decision    |
| Body/environment loop             | Body/environment versions, state, update order                                                    | Cosmetic body changes with no decision input            |
| Time/replay                       | Tick, dt, PRNG, order, pause/stale/missing policy                                                 | Changing conditions during pause/acceleration           |
| Plasticity/continuity             | Frozen/trainable components, parent checkpoint, candidate/adopted policy, experience/fork lineage | Confusing replacement/copying with learning or identity |
| Matched evaluation                | Shared tape, frozen baseline, held-out split, costs, repetitions, body state                      | Treating one profit or animation as learning evidence   |

[MaleCNS](https://male-cns.janelia.org/) supplies connectivity, not validation of this game's trading/body/learning rules. Trace the actual extracted executable artifacts, not merely a website citation.

Classify synthetic-demo, bio-inspired, and connectome-derived separately. Validation is an independent scoped claim with conditions/evidence/reviewer, not a global biological-validity boolean. Action-derived bubbles are not neural activity measurements.

## Profile inheritance and standardization

Share model/transition meaning; task profiles add channels, units, and actions, not separate ownership schemes. Future control changes must preserve explicit state lineage; forks should identify parent checkpoints/new branches. Portable persistent forks were not implemented in this review.

The mistakenly introduced BioAgentNFT/BioAgentSBT experiments were removed; stimulus transport moved to an ordinary registry. Prioritize [Embodied Learning Profile](embodied-learning-profile.md) semantics and conformance. Existing ownership/signature/memory mechanisms can be composed; a mailbox alone is not a biological invention.

Start with an offchain profile attachable to existing agent identities. Decide standalone ERC versus extension only after independent implementations read the same records consistently.
