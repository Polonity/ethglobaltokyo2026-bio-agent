# Documentation

Start with the [project overview](../README.md), then use this index to explore execution, implementation, and research evidence. Default documentation is in English. Explicit Japanese (`-ja` / `.ja`) and bilingual (`ja-en`) editions remain available for presentation and study.

## Use the project

| Goal | Guide |
| --- | --- |
| Try decisions, learning, and policy save/restore | [Framework / Research Lab](../packages/bioagent-framework/README.md) |
| Observe public chain inputs | [Sepolia Lab](deployment/sepolia.md) |
| Run a local chain and GUI | [Anvil + Workers](deployment/local-anvil.md) |
| Run all 166,700 neurons | [Full runtime](design/malecns-full-local.md) |
| Run and train the full-neuron applications | [Three-task acceptance guide](submission/full-apps-acceptance.md) |
| Run four agents in one market | [Shared market](apps/shared-market/README.md) |
| Understand controls and agent state | [Application guides](apps/README.md), [GUI design](design/demo-experience.md) |

## Design

- [Framework layers and API](../packages/bioagent-framework/README.md#layers)
- [Runtime boundaries, languages, communication, and storage](architecture.md)
- [Purpose and design direction](standards/bioagent-design-direction.md)
- [Why define BioAgent?](standards/why-bioagent.md) · [Comparison with existing standards](standards/prior-art-and-bioagent.md)
- [Embodied learning profile](standards/embodied-learning-profile.md) · [Application types and units](standards/application-types.md)
- [Registry design](design/README.md) · [Onchain contracts](design/onchain-contracts.md) · [ERC-style draft](standards/bio-agent-draft.md)
- [Event-driven runtime proposal](design/runtime-and-events.md) · [Agent and wallet extensions](design/agent-types-and-wallets.md)

## Research and verification

- [Learning findings, controls, and side effects](research/bioagent-adaptation/README.md)
- [Experiment-derived requirements](standards/experiment-derived-requirements.md)
- [MaleCNS sources, attribution, and modifications](data-sources.md)
- [Biomimicry and comparison plan](submission/biomimicry-positioning.md)
- [Full-model measurements](design/malecns-full-local.md)
- [Circuit evidence](design/circuit-evidence.md) · [Synthetic Swap fixture](design/swap-event-game.md)
- [Learning infrastructure](design/malecns-learning.md) · [Full-app learning plan](design/full-app-learning.md)
- [Original foraging model](design/fly-arena.md) · [Body state and checkpoints](design/embodied-foraging.md)
- [Paper-trading design](design/paper-trading-arena.md) · [Implementation scope audit](submission/goal-audit.md)

## Development and operation

- [Development and checks](development.md) · [Contracts](../contracts/README.md)
- [Local API](reference/local-api.md) · [UI localization](i18n.md)
- [Workers deployment](deployment/workers.md) · [Sepolia deployment](deployment/sepolia.md)
- [External integrations and partner material](integrations.md)

## Video and presentation

- [Bilingual submission videos, Q&A, and evidence](submission/presenter-kit/README.md)
- [Recording procedures and historical recordings](demo-video.md)
- [Explanation slides](presentation/README.md)
- [Submission index](submission/README.md) · [Project thesis](submission/bioagent-thesis.md)

## Terms

| Term | Meaning |
| --- | --- |
| BioAgentStatus | Onchain input conditions: activity, energy supply, and stimulus |
| Registry | Contract retaining agent definitions and the latest input state |
| Runtime | Execution environment computing actions from inputs and internal state, in a browser or Python depending on the task |
| revision | Input update number |
| policy version | Learned-policy version, separate from input revision |
| modelHash | SHA-256 identifying the registered model artifact; each implementation defines the exact target bytes |
| Applied | An input has reached the agent; distinct from chain finality |
