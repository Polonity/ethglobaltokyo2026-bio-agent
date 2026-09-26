# Biological Agent Protocol — English spoken demo script

This is the primary script for the presenter's own English narration, also used for supporting English captions. The Japanese file is for comprehension only. Approximate 3:46 structure; actual speaking time and subtitle timing must be checked against the human recording. No synthetic voiceover. Bracketed directions are not spoken.

Short-language revision: 235 written words; leave silent pauses rather than filling the entire timeline. Read product identifiers naturally; AMD Ryzen 9 9950X = “AMD Ryzen nine, ninety-nine fifty X.”

Read one short line at a time and leave room for the GUI. MOMO: MOH-moh. SORA: SOH-rah. Use a calm conversational voice for explanations and a brighter sports-commentary voice for the approach and collection. Do not rush to imitate a professional race caller.

## 0:00–0:25 · What if this fly ran on onchain data?

[0:00–0:15 · Official MaleCNS project webpage screenshot. At 0:15, cut to the GUI as MOMO and SORA are introduced.]

This is MaleCNS v1.0: a map of a fruit fly's neural connections.

Could it become an agent driven by onchain data?

We built an app.
Meet MOMO and SORA.

Let's send them a stimulus.

## 0:25–0:50 · First, a failed attempt

[Earlier implementation]

Go, MOMO!
Right… and still right…

Wait! The food is over here!

[Pause]

There goes MOMO.

We found a bug: tied scores always picked right.

## 0:50–1:51 · The Biological Agent Protocol

[Switch from GUI to the 42-second stimulus-to-action animation. Speak each line as its numbered stage is highlighted; do not read the arrows aloud.]

[01 · 0–6 s · Confirmed TX]
Transactions record food and hazard locations.

[02 · 6–12 s · Sensory encoding]
The adapter creates sixteen inputs.

[03 · 12–18 s · Neural activity]
MaleCNS turns these inputs into neural activity.

[04 · 18–30 s · Action readout]
To keep the connections fixed and the readout light, we chose ridge regression.
It scores eight directions and rest.

[05 · 30–36 s · Execute movement]
The app moves the fly using the chosen action.

[06 · 36–42 s · Record experience]
We save actions and rewards for training.

[Return to GUI. Hardware/method lower third; approximately 19 seconds remaining.]

Training runs on an AMD Ryzen 9 9950X CPU.
Let's try again.

## 1:51–2:31 · MOMO and SORA try again

[Normal speed; speak after the movement appears]

Stimulus confirmed.
MOMO moves. SORA follows.

They're getting closer!

[Same actions · 0.25x replay]

Let's watch that slowly.

Almost there…
MOMO got it!

Now, SORA…
Got it!

[Show the counters; return to an explanatory tone]

One each.
Does it work in other layouts?

## 2:31–2:56 · What worked—and what remains unresolved

[Recorded validation results]

On twelve new layouts, they collected all twenty-four food items.

A simpler model collected twenty-three.
Hazard avoidance still needs work.

We measured both success and failure.

## 2:56–3:21 · Beyond the terrarium

[Separate verified market recording]

We also built a market app.

Agents use 1inch Aqua Protocol for liquidity offers, and Uniswap v3 for swaps.
Here are the ERC-20 transfers.

[On-screen label: Test assets · Ethereum fork]

## 3:21–3:46 · Our proposal

[Show the 24-second protocol-design animation. Keep the model credits visible in its footer.]

[0–6 s · IBioAgent]
Here is our design.
IBioAgent defines input status.

[6–12 s · IBioAgentStimulus]
IBioAgentStimulus accepts stimuli with a schema.

[12–18 s · Framework]
The framework reads inputs and runs MaleCNS.

[18–24 s · Applications]
Apps execute the actions.
We call this the Biological Agent Protocol.

## Model attribution on screen (not spoken)

Pronunciation: MaleCNS = “male C-N-S.” This is connectome data used by our runtime, not a validated behavioral model supplied by the dataset authors.

Show `Connectome data: MaleCNS v1.0 · male-cns.janelia.org` during the opening. Display the full credit in [video-credits.md](video-credits.md) in the closing design animation for at least 10 seconds, above the spoken captions. Credits must be burned into the final video; a description link alone is insufficient.

## Editorial notes

- MOMO collects before SORA in the saved run; confirm visible counter changes before placing each line.
- Keep pauses. Do not narrate every movement at normal speed; use the explicitly labelled slow replay for detailed commentary.
- The old failure and revised run are different implementations. Do not imply that a simple retry fixed the issue.
- Model responses do not establish thoughts, feelings, biological realism, or general superiority.
- The market uses EOA signers. Describe it as a wallet integration, not an implemented smart-wallet authorization system.
- The narrative order is editorial, not a claim about when the protocol was first implemented.

- The diagram is an explanatory animation with illustrative values, not a replay of measured neural activity. The learning step represents a separate training phase.
- Hardware caption: AMD Ryzen 9 9950X · CPU execution · Python / NumPy / SciPy. The installed NVIDIA RTX PRO 6000 Blackwell Workstation Edition is not used by this inference/training path.
- Both adopted foraging policies use `ridge-linear`, confirmed from the saved policy artifacts. Keep the fixed-connectivity detail in the diagram and Q&A rather than adding a disconnected disclaimer to the narration.
- Use [animation-cues.md](animation-cues.md) for frame timing, source mapping, and hardware evidence. Replace rehearsal timing with timing from the human narration before final export.
