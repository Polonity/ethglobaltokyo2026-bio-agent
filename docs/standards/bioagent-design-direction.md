# BioAgent design direction — semantics before interfaces

Design review, 2026-09-26. **Proposal; ABI not finalized.** This does not automatically make existing contracts conform to a new standard. See [rationale](why-bioagent.md) and [submission thesis](../submission/bioagent-thesis.md).

## Core idea

A proposed BioAgent uses structure derived from measured biological connectivity in its input-to-action computation. Common tools also support synthetic controls, labeled separately. Keep general-agent API compatibility and add biological provenance/model interpretation through profiles. Body state and learning are cross-cutting concerns, not sufficient justification for a separate standard.

The aim is consistent meaning across applications for individuals whose behavior changes with biological structure, body, and experience. An NFT, stimulus event, mascot, or model hash alone does not provide that meaning. Record what came from biology, what was engineered, and under which conditions an individual changed.

NFT/SBT were examples of base-and-extension relationships, not feature requirements. Earlier tokenization experiments were removed and must not define the submission.

## Appearance versus models

Show actual encoded observations and pre/post state when testing hunger/fullness or experience effects. A financial-to-sensory adapter is engineered, not evidence that a fly understands finance. Declare connectivity, dynamics, mappings, and plasticity separately. Synthetic Q-learning remains a labeled control; it need not be called biological.

| Concept           | Meaning                                                        | Keep separate from                                  |
| ----------------- | -------------------------------------------------------------- | --------------------------------------------------- |
| Agent identity    | Continuously tracked individual                                | Model type, current owner, wallet                   |
| Model descriptor  | Origin, dynamics, sensory/motor/body mapping, trainable scope  | Mutable state or blanket validity claims            |
| Stimulus          | Provenance/time/schema-bound input                             | Execution order, executed action, reward            |
| Checkpoint        | Body, neural transients, policy, PRNG, and other resume state  | Supplied energy or GUI position alone               |
| Transition        | State + input → action + next state                            | TX success or file replacement                      |
| Learning evidence | Changed parameters, conditions, evaluation, adoption/rejection | Changed behavior, one profit, or learning animation |

Many concepts apply to ordinary AI. The profile adds explicit biological structural origin, interoception, circuit/sensory/motor correspondence, and plasticity semantics; it does not claim these are exclusive or unprecedented.

## Core and task profiles

```text
Semantic core: origin + dynamics + mappings + state + clocks
  stimulus → transition → learning evidence
  ├─ foraging: food / hazards / satiety → move / feed / rest
  └─ market observation: Swap → encoder → response
       └─ paper trading: policy → execution guard → ledger / PnL
```

Do not fix Rest/Explore/Forage or Buy/Hold/Sell into the generic core. Separate attention from action. Body schemas declare units/equations instead of imposing one biological scale. Share provenance/time/continuity while task profiles define channels/actions.

## Interface direction

Define the semantic profile first, then its minimal onchain boundary. Model/state descriptions need encoding and validation. Identity binding may reuse existing registries. `IBioAgentStimulus` is an experimental schema/nonce/event transport, with separate source/deadline/authorization review. Offchain observe/advance/checkpoint/restore is not a Solidity ABI. Reuse commitment mechanisms where appropriate rather than inventing another generic history registry.

Preserve existing `IBioAgent.sol` as foraging-input profile v0 for GUI compatibility. `getStatus` returns input settings, not neural state or lifecycle. Any future rename/split must follow responsibility/ABI review. JavaScript `IBioAgentRuntime` does not inherit the Solidity interface: it validates/interprets accepted inputs.

## Existing specifications and experiments

[Prior art](prior-art-and-bioagent.md) discusses ERC-8004 identity, ERC-7857 private model/memory transfer, and ERC-8350 state commitments. These remain integration candidates, not compliance claims. Prioritize an [Embodied Learning Profile](embodied-learning-profile.md); standalone ERC versus extension remains undecided pending independent interoperability.

Minimum demonstrations: vary body state with fixed input/policy; compare learning/no-learning; trace TX→mapping→prestate→action→poststate; replay a complete checkpoint within declared precision; trace dataset→graph→runtime. Do not assume every body change changes the action.

Historical synthetic body/checkpoint tests and Circuit Lab's measured7-neuron/19-edge ablation/independent-Python agreement establish local capabilities. They do not establish physiology, portable cross-application checkpoints, or full-profile conformance. See [body model](../design/embodied-foraging.md).

## Design gates

Freeze concepts/non-goals; compare two task profiles; define descriptor/observation/checkpoint/transition schemas, exact hash bytes, units, PRNG/time/errors/test vectors; implement two independent readers/writers; then choose the minimal ABI/events/authority/storage boundary. NFT/SBT removal and shared views are implementation steps, not profile certification.

Success means another implementation can interpret origin, input, decision state, and learning consistently—not more interfaces. [Application types v1](application-types.md) provides TypeScript types/examples/error checks; complete JSON validation, artifact encoding, runtime migration, and a generic Solidity ABI remain incomplete.
