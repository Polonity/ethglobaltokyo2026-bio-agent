# Stimulus-to-action animation cues

Production narration is the presenter's English voice; Japanese is for understanding. Insert the 42-second animation at 0: 55, then return to GUI. Read [English script](documentary-script-en.md) or [Japanese translation](documentary-script-ja.md). Rehearsal stages are6 seconds each except12 seconds for action evaluation; adjust to the actual recording when necessary.

[Interactive animation with language switch/seek](visuals/stimulus-to-action.html).

| Animation time | Highlight                     | Implementation                                                                                                                             |
| -------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| 0–6 s          | Confirmed receipt→world       | TX-derived food/hazard coordinates                                                                                                         |
| 6–12 s         | 16 inputs and rightward links | Environment/body→16 drives                                                                                                                 |
| 12–18 s        | Recurrent MaleCNS connections | Four fixed-graph updates and population summaries                                                                                          |
| 18–30 s        | Nine predicted scores/max     | Explain choosing lightweight readout learning with fixed wiring, then ridge regression for immediate action rewards; select allowed action |
| 30–36 s        | Left action changes x         | JavaScript updates coordinates; GUI renders                                                                                                |
| 36–42 s        | Experience→learning           | SQLite stores features/actions/rewards; a separate phase fits the readout                                                                  |

Label schematic examples from the start. Values/scores/movement are not recorded MOMO neural activity. World inputs are TX-derived; body, motion, and inference are offchain. The learning arrow does not mean per-frame training.

## Implementation correspondence

- `services/full-apps/foraging.mjs`: observe builds9 action-direction drives plus energy, satiety, reserves, stimulus, world energy, distance, constant =16 inputs. apply maps8 directions/rest to movement.
- `packages/bio_agent/full_apps/brain.py`: infer drives16 sensory groups, computes4 steps, summarizes sensory/motor/superclass activity.
- `packages/bio_agent/full_apps/learning.py`: standardized per-action ridge regression, L2=0.1, intercept=0.001; chronological70% fit/30% prediction check.
- `.local/presenter-long/experience.sqlite3`: adopted MOMO/SORA full-mode v2 policies use ridge-linear. Tree candidates exist in code but were not adopted here.
- `packages/bio_agent/full_apps/action_selection.py`: choose maximum score among allowed actions, seeded tie-breaking, exploration during collection.
- Runtime ID:`malecns-full-positive-rate-v1`; source dataset:`male-cns:v1.0`. Distinguish model from dataset.

## Hardware and names

Host inspection on 2026-09-26 found AMD Ryzen9 9950X16-Core Processor and NVIDIA RTX PRO6000 Blackwell Workstation Edition. This path uses NumPy/SciPy on CPU, not CUDA. This host check does not retroactively prove every historical run's configuration.

Onscreen: `AMD Ryzen 9 9950X · CPU execution · NumPy / SciPy`. Use formal [1inch Aqua Protocol](https://1inch.com/aqua) and [Uniswap v3](https://developers.uniswap.org/docs/protocols/v3/overview); show ERC-20 transfers in receipts.

## Render and closing design

`node scripts/submission/render-protocol-animation.mjs` produces `artifacts/protocol-animation/stimulus-to-action-{en,ja}.mp4`: 1280×720, 42 seconds, silent. These are narration assets, not finished submissions. [Credits](video-credits.md).

Show the [24-second design animation](visuals/protocol-design.html) from 3: 26, highlighting IBioAgent→IBioAgentStimulus→framework→application for 6 seconds each. Keep credits visible for the last12 seconds and subtitles in a separate band.

- IBioAgent getStatus/updateStatus describes input conditions, not neural-state writeback.
- IBioAgentRegistry extends IBioAgent for identity/model registration; BioAgentRegistry also implements IBioAgentWallet.
- IBioAgentStimulus submitStimulus(agentId, expectedNonce, schema, payload) is implemented by the extending BioAgentStimulusRegistry. Dataflow arrows do not imply all interfaces inherit one another.
- IBioAgentWallet is an owner-declared association, not execution delegation; no authority arrow to app execution.
- The full Python/Node path does not inherit the separate JavaScript IBioAgentRuntime class.

Render with `node scripts/submission/render-protocol-animation.mjs protocol-design`; outputs protocol-design-{en, ja}.mp4 in the same artifact directory.

## Progressive disclosure

Current stage is opaque; completed stages remain at 24–25% opacity. Hide unexplained text/arrows, showing only faint future boxes. Fade over 0.55 seconds and introduce supporting text sequentially. Credits appear at 12 seconds and remain through the end.

Use left-to-right layers with recurrent connections inside MaleCNS. Arrows show data transfer, not end-to-end backpropagation through a feedforward network. `render-documentary.mjs` assembles the silent3: 56review; [the audio step](documentary-production.md) adds the recorded voice separately.
