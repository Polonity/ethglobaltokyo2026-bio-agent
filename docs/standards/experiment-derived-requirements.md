# Experiment-derived BioAgent requirements

2026-09-26. Design proposal, not a deployed ABI change or full conformance claim. [Preregistered protocol](../research/bioagent-study-20260926/protocol.json); detailed runs/failures: `artifacts/bioagent-study-20260926/`.

These are proposed requirements derived from the experiments, not a new deployed ABI or a claim of full conformance.

- Report objectives **and adverse effects**, with units, direction, constraints and explicit adoption rules. More food with more contacts is not automatically an improvement.
- Separate candidate generation, evaluation, adoption and rejection. The stricter experimental gate rejected all 12 internally accepted candidates: it preserved behavior but also prevented progress.
- Keep prediction quality separate from task outcomes. The synthetic market learner reduced losses in two regimes and worsened the third; it did not establish profitability.
- Declare how teaching targets are produced and include simple controls. Aqua's known synthetic target is computed exactly by its defining formula, so fitting it does not demonstrate a need for a biological circuit.
- Bind artifacts to model, individual, task and policy version. Reusing a readout within its task is different from transferring skills to another task.
- Bind executable strategies to a common input revision. One IBioAgent update invalidated stale strategies in two consumer contracts while leaving a different individual usable.
- Give the environment one clock owner. Calling the current base `step()` once per agent advanced a shared Arena twice; schedule the world once per tick.

The minimum common boundary should cover identity and provenance, input acceptance, optional learning capabilities, evaluation records, artifact compatibility, and environment scheduling. Learning algorithms remain task-specific. A UI snapshot, policy artifact and complete replay checkpoint are distinct capabilities.

Solidity `IBioAgent` is implemented by the Registry and consumed by applications; it is not their runtime superclass. The three JavaScript subclasses share an observation/execution/view loop but all wrap the same foraging engine. Paper-market and Aqua learning remain separate implementations. Full-profile interoperability is still unproven.

## Evaluation record semantics

```text
EvaluationRecord
  taskProfile, modelDescriptor, candidatePolicy, baselinePolicy
  trainingInputs, selectionInputs, finalTestInputs
  initialState, environmentProfile, executionAndCostModel
  metrics[]: { name, unit, direction, baseline, candidate }
  constraints[]: { metric, comparator, threshold, satisfied }
  adoptionRule, decision: adopt | reject, reasons[]
  sourceEvidence[], limitations[]
```

This is not a finalized wire encoding. Declare trainable scope without forcing one learning algorithm on every task. Keep task-specific reward units separate rather than adding/averaging them across applications. Distinguish policy transfer from complete body/RNG/world/experience restoration. Identify the environment and its clock owner.

## Implementation follow-up

The opt-in [BioAgent Framework](../../packages/bioagent-framework/README.md) now implements a common foraging/Aqua lifecycle, compatibility-bound policy restore, shared Arena clock, and RPC-to-decision provenance. [Follow-up findings](../research/bioagent-adaptation/README.md) motivated an optional minimum final-energy adoption constraint.

These capabilities do not imply full proposed TypeScript-profile conformance. The package uses the 7-neuron slice; full Python remains separate. Cross-task skills, cryptographic RPC proofs, transaction execution by this package, and measured platform growth are not established.
