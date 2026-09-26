# BioAgent Framework

An experimental monorepo framework that receives on-chain BioAgent state, runs a fly-derived connectome, and returns traceable decisions. Foraging and Aqua adapters share candidate training, evaluation, adoption and policy save/restore.

[日本語 / full API guide](README.md) · [Research findings](../../docs/research/bioagent-adaptation/README.md)

## Layers

![BioAgent Framework architecture](docs/layers.png)

Generated with the built-in imagegen tool. [Exact prompt](docs/imagegen-prompt.txt).

| Layer | Responsibility | Implementation |
| --- | --- | --- |
| Blockchain input | Owner, model hash, status and revision | Existing `IBioAgent` / `BioAgentRegistry` |
| Source and validation | Read a pinned block; check chain, registry, identity, model and freshness | `EvmBioAgentSource`, `ChainDecisionRunner` |
| Connectome engine | Measured MaleCNS slice, fixed topology, engineered dynamics | Existing `male-cns.js` / `circuit.js` |
| Task runtime | Task-specific encoding and decisions; common learning lifecycle | `LearningBioAgent`, `ForagingBackend`, `AquaBackend` |
| Applications | Display, record and consume decisions | Research Lab and custom consumers |
| Shared clock | One Arena advance per tick | `SharedArenaClock` for existing foraging adapters |

The Solidity interface describes **inputs**. The JavaScript class inherits the existing off-chain `IBioAgentRuntime`. This release uses a measured **7-neuron, 19-edge slice**. The existing 166,700-neuron runtime is separate and has not been integrated into this framework. Neither is a claim to reproduce a biological fly's thinking.

## Run from the repository root

Requires Node.js 22.14+; the package is private and currently uses sibling monorepo packages.

```sh
npm ci
npm run test:framework
npm run research:adaptation
npm run test:framework:chain       # requires Forge and Anvil; isolated local chain only
npm run test:framework:browser
npm run framework:lab             # http://127.0.0.1:8826/
```

The bilingual UI lets you train, evaluate, adopt or reject, save and restore policies for two different task engines. Its controls use local simulation. The chain section replays archived records from an actual local Registry deployment, at the original block timestamps. It is not a live RPC connection.

## Integrate

Use `LearningBioAgent(identity, backend)` with `observe`, `step`, `snapshot`, `train`, `evaluate`, `adopt`, `exportPolicy` and `restorePolicy`. See the [working API example](README.md#共通apiを使う). Policies bind identity, task, model, encoder, dynamics, readout and action space. Restore rejects incompatible artifacts and discards pending candidates. It restores a policy, not the full environment state. SHA-256 checks content integrity; it is not an author signature.

Read a compatible deployed Registry without a key or signer:

```sh
node packages/bioagent-framework/examples/read-chain.mjs \
  RPC_URL CHAIN_ID REGISTRY_ADDRESS AGENT_ID aqua 2
```

The adapter requires both `getAgent` and `getStatus`; not every bare `IBioAgent` implementation supplies the metadata extension. `2` means reading two blocks behind head, not guaranteed finality. Use explicit `0` for immediate local-chain checks. Model hashes must match the configured slice; the runner verifies the actual graph bytes before decisions and caches the successful check. The default freshness window is 120 seconds from the sampled block timestamp. Rollback/conflicting observations are rejected; automatic deep-reorg recovery is not implemented. The RPC is trusted; externally supplied JSON is not proof of chain state.

Outputs contain input provenance, model/mapping identifiers and policy version/hash. The framework performs **no transaction, signing or approval**. Execution authorization and latest-state checks remain the consuming application's responsibility. `SharedArenaClock` avoids duplicate environment stepping through its API; do not mix it with direct legacy `step()` calls.

## What the experiments establish

With 5 search seeds and 60 unseen worlds per profile, default-profile mean reward rose **18.79 → 56.12**, food **6.80 → 20.84**, and contacts **1.25 → 0.10**. Three readout coefficients were fitted; neural topology remained fixed. Direct-input controls reached **56.08**, so biological superiority was not established. A particular fixed rule scored **49.05** with slightly fewer contacts (**0.083**); the learner did not dominate every metric. The added hazard guard did not change these results. Reduced resting was the visible behavioral change, with a cost: final energy fell 0.722 → 0.361 and low-energy ticks rose 0 → 48.50. An optional final-energy adoption floor can reject such tradeoffs and is included in artifact compatibility.

The result is a reusable framework for **traceable decisions and measurable adaptation**, not evidence of trading profitability, router adoption, LLM-equivalent performance or energy savings. The approximately 600-byte policy artifact is not a runtime RAM measurement. [Detailed results and limitations](../../docs/research/bioagent-adaptation/README.md).
