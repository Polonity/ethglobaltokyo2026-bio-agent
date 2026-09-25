# BioAgent Embodied Learning Profile v0.1

**Proposed semantic profile; partially exercised by synthetic demos, not fully implemented or conformant.** [Application type definitions](application-types.md) now exist with compile-time examples; they are not full runtime conformance. 2026-09-26. This document specifies what future conforming producers/consumers must mean by biological origin, embodiment and learning continuity. It does not add deployed Solidity interfaces or claim compliance with an assigned ERC. MUST/SHOULD/MAY are normative only for implementations claiming this proposed profile.

## 1. Scope and identity

The profile is optional metadata associated with `(chainId, registry, agentId)`. It is independent of NFT/SBT tokenization and may accompany a future adapter to an existing Agent identity standard. The profile MUST NOT require a particular species, trading venue, neural simulator or ownership transfer policy.

A profile consumer MUST distinguish **declaration**, **content integrity**, **reproduced execution**, and **task-specific validation**. A hash or control authority is not evidence for the last two.

## 1.1 Why this is an extension

[Research rationale](why-bioagent.md) distinguishes common agent infrastructure from connectome-specific interpretation. The target BioAgent uses measured biological connectivity in its action-generating computation. Synthetic and bio-inspired implementations may use the shared format as explicit comparison classes; they MUST NOT claim connectome-derived status.

Identity, authorization and communication remain shared with general agents. Embodiment and learning are cross-cutting capabilities, not exclusive biological properties. The additional profile describes source-to-model correspondence, dynamics, engineered mappings, retained biological constraints and the scope of validation. It does not require every agent to have a simulated body or online plasticity. An independent ERC is conditional on demonstrated interoperability needs.

## 2. Model descriptor

A descriptor MUST declare:

| Field group | Required semantics |
| --- | --- |
| `modelClass` | synthetic-demo, bio-inspired or connectome-derived; not a fidelity ranking |
| `source` | For connectome-derived: dataset release, source URI, exact file digests, extraction code/config digests, graph digest, attribution/license; otherwise explicit not-applicable |
| `dynamics` | Equation/algorithm reference, executable digest, parameter artifact, precision and runtime dependencies; graph topology alone is insufficient |
| `sensoryMapping` | Versioned external-input to model-channel mapping: units, scaling, clipping, delays, missingness, channel/cell identifiers and assumptions |
| `motorMapping` | Versioned model-output to action mapping, including external guards. A guard overriding an action MUST be observable separately |
| `bodyModel` | State schema with units/bounds, update rule, integration order and coupling to the model; absent for a non-embodied implementation |
| `plasticity` | Which topology/weights/gains/readouts may change, algorithm and optimizer state, which values are frozen, and which external rules are fixed |
| `validationClaims` | Zero or more scope-specific claims referencing evidence and method; no blanket biologically-valid boolean |

The existing `modelHash` remains SHA-256 of the exact existing manifest bytes. Extending a descriptor MUST NOT silently alter the meaning of an already registered hash. New descriptor versions get new digests. Physiological meanings MUST NOT be inferred from matching field names such as energy.

## 3. Closed-loop observation frame

The future wire encoding is **not frozen**. These are required semantic fields, not a currently deployable ABI:

```text
ObservationFrame
  agentRef, episodeId, branchId, descriptorDigest
  tick, dt, simulationTime, sourceTime, receivedAt
  inputReferences[], sensoryMappingDigest, exteroceptiveInputs
  bodyModelDigest, bodyStateBefore, interoceptiveInputs
  policyDigest, previousCheckpointDigest
```

One input may be a confirmed chain log, another a local food collision. Producers MUST retain their distinct origins and trust levels. Market-to-neuron mapping is an engineered adapter, not evidence that a fly understands financial prices.

An embodied producer MUST feed declared internal body state into its observation/model, not only into rendering. A state observer MUST be able to identify the values actually used at the decision tick. Do not claim a synapse or biological neuron represents hunger without supporting mapping evidence.

Satiety, stored reserves/body mass and immediate activity energy SHOULD be separated if modeled. Their units and equations belong in bodyModel, not a universal Solidity enum. Fullness can change quickly; slow body change requires its own dynamics. These are simulation choices unless separately validated physiologically.

## 4. Clock and update order

A descriptor MUST declare simulation dt, supported numeric precision, PRNG algorithm/state, and pause/missing-data policy. Chain timestamp MUST NOT implicitly substitute for simulation time.

A reference order is: read pre-tick body/neural state → encode external/internal observations → infer action → apply action/environment transition → update body → apply declared learning update → checkpoint. Alternative orders require distinct descriptors and MUST NOT be mixed as identical experiments.

A consumer MUST NOT silently advance a paused or stale-input simulation with an arbitrary elapsed wall-clock interval. On resume, freeze, explicit bounded catch-up or offline evolution is declared. Paper position valuation can continue during a learning pause; the pause is not immunity from market loss.

## 5. Checkpoint and transition record

A replay-capable checkpoint MUST cover all state needed by that execution model: body, neural transient state, policy/weights, optimizer, experience/replay buffer or exact references, PRNG, environment, tick and ordered input cursor. Omitted state MUST make the reproducibility limitation explicit.

A transition record MUST associate:

```text
beforeCheckpoint → consumedInputReferences → action / external override
                 → afterCheckpoint
                 → candidatePolicy / evaluationEvidence / adoptedPolicy
```

The initial state has explicit genesis. Later transitions MUST name their predecessor and identity/episode/branch. Lifecycle labels include run, train, evaluate, adopt, reject, fork and restore; producers MUST NOT call every training attempt an adoption. Failed candidates remain traceable without replacing the active policy. Reorg recovery MUST restore affected learned state/experience as well as positions; dropping a log does not unlearn it.

This profile does not introduce another generic state registry. An ERC-8350 adapter is a candidate for anchoring these records using that proposal's exact commitment/signature rules; it is **not implemented or claimed conformant**. Descriptor/transition semantic hashes MUST NOT be presented as ERC-8350 Transition IDs. Public stimulus payloads MUST NOT contain private checkpoints or encryption keys.

Exact canonical serialization, domain-separated commitment encoding and reference test vectors are release blockers before wire interoperability can be claimed. This version intentionally does not fabricate a compatible ABI or cryptographic proof.

## 6. Learning evidence

Training data/time range, validation range, held-out evaluation range, reset policy, body initial conditions, market execution/cost model and frozen baseline MUST be recorded for any claim of improvement. Repeatedly used model-selection seeds MUST NOT be called untouched held-out evaluation.

Compare learned and frozen agents on the same input tape with equivalent initial conditions; include seed variation where stochasticity matters. A claim that embodiment or connectome structure contributes to behavior SHOULD include an appropriate ablation, such as a body-input-disabled run. Current browser Q-learning validation courses are selection benchmarks, not proof of generalization or connectome learning.

No profitability, intelligence, biological fidelity or conscious emotion claim follows from record validity. A fixed up→curious/down→cautious mapping MUST be labeled fixed, even when the surrounding foraging environment has a learner.

## 7. Authority changes, fork and restore

Identity continuity and control authority are distinct. If a future implementation changes its controller, it must specify queued-input invalidation and a resume boundary. It MUST NOT silently erase a declared individual's learned/body state. State custody/availability requires a separate mechanism; missing state means unavailable, not a freshly initialized equivalent individual. This does not require token transfer support.

Fork creates a distinct agent/branch with a reference to the copied checkpoint. It MUST NOT overwrite the parent's history. Restore links to the restored checkpoint and records a new branch/continuation boundary; a competition MUST define whether it is allowed. An identity record does not enforce exclusive execution or prevent off-chain copying.

## 8. On-chain boundary

On-chain: identity, authority, accepted stimulus references, and selected commitments/attestations when implemented. Off-chain: source graph, high-frequency dynamics, body evolution, replay data and evaluation. A public GUI can interpolate a belly shape between snapshots; it MUST label interpolated/rendered values separately from committed values when claiming on-chain evidence.

ERC-4906/7496 integrations are optional display/export layers, not the biological loop. Wallets are a separate actuation/payment layer, not neural autonomy. NFT/SBT support is not a requirement of this profile.

## 9. Conformance scenarios and current gaps

| Scenario | Required observable evidence | Current repo |
| --- | --- | --- |
| Model origin | Trace declared class to used artifact, reject missing connectome provenance | Synthetic games plus measured MaleCNS slice; registered descriptor/artifact integrity checker for this fixed bundle; no general validator |
| Same stimulus, different body | Same policy/input, controlled body change alters the declared observation; show action outcomes even if unchanged | Synthetic foraging body/observation/action controlled test passes |
| Replay | Same complete checkpoint+tape+runtime reproduces within declared tolerance | Foraging local checkpoint restores racing/training exactly; circuit JS/Python traces match within 1e-12; full profile portability absent |
| Learning | Distinct candidate/adoption, held-out/frozen comparisons | Candidate selection exists in both apps; independent held-out evidence and full portable record absent |
| Authority boundary (if supported) | Old commands invalidated; state continuity or explicit unavailability | Controller change is not part of the current base Registry |
| Fork | New identity + parent checkpoint; independent subsequent history | Not implemented |
| Source rollback | Restore pre-orphan state including learning effects | Swap reader rejects some invalid/reordered inputs; persistent rollback absent |

A future release must publish encoding/test vectors, cross-implementation replay evidence and the adopted existing-standard adapters. Until then, this is a specification target, not a conformance badge.
