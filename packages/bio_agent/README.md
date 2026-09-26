# BioAgent runtimes

| Implementation | Responsibility |
| --- | --- |
| `browser/arena.js` | GUI decisions, competition, experience, and Q-learning |
| `__init__.py` | Independent threshold model for the Python API scaffold |
| `full/`, `full_apps/` | Separate full-neuron model and application runtime; see the [full model guide](../../docs/design/malecns-full-local.md) |

## Browser runtime

The Arena maintains positions, body energy, scores, Q-values, and experience, advancing at 5 Hz. `applyAgentStatus` applies inputs to the target agent. RPC/HTTP acquisition is outside this module.

- Inputs: rest / explore / forage, energy supply, and stimulus, normalized from contract values 0–10000 to 0–1.
- Observations: food direction, hazards and boundaries, and low body energy.
- Actions: movement in eight directions or rest.
- Learning: recent experience and practice environments; candidates are evaluated and adopted only when the acceptance criteria improve.
- Outputs: agent state and behavior/learning events; no automatic onchain writeback.

Browser tabs run independently. See [Fly Lab design](../../docs/design/fly-arena.md) for the original foraging model and its learning/round lifecycle.

## Python scaffold

`step(Stimulus) -> AgentState` selects rest/explore with a mock threshold rule. It is separate from browser Q-learning and the full-neuron runtime. Training artifacts are not automatically applied to it.

Run `npm run test:arena` and `make test` from the repository root.

## Agents with different input sources

`runtime/agents.js` defines `ForagingBioAgent` and `UniswapPriceBioAgent`, extending `IBioAgentRuntime`. This is a separate extension foundation. `npm run demo:agents` demonstrates stimulus-to-decision behavior on fixed data. See [sources, interfaces, and wallet boundaries](../../docs/design/agent-types-and-wallets.md).
