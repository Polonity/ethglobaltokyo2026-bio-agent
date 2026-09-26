# Biological Agent Protocol — English spoken demo script

This is the primary script for the presenter's own English narration, also used for supporting English captions. The Japanese file is for comprehension only. Approximate 3:40 structure; actual speaking time and subtitle timing must be checked against the human recording. No synthetic voiceover. Bracketed directions are not spoken.

Read one short line at a time and leave room for the GUI. MOMO: MOH-moh. SORA: SOH-rah. Use a calm conversational voice for explanations and a brighter sports-commentary voice for the approach and collection. Do not rush to imitate a professional race caller.

## 0:00–0:25 · What if this fly ran on onchain data?

When I saw MaleCNS version one point zero—a map of a male fruit fly's neural connections—I had a thought.

What if we turned it into an agent driven by onchain data?

So we built an application.
Meet MOMO—and SORA.

How will they respond to onchain stimuli?

## 0:25–0:50 · First, a failed attempt

[Earlier implementation]

And MOMO is off!
Heading right… still heading right…

Wait. The food isn't that way.
MOMO, are you just going to keep going?

[Pause]

…There goes our fly.

It moved, but it didn't approach food.
We found that when actions had identical scores, the selection code kept choosing right.

## 0:50–1:45 · The Biological Agent Protocol

[Switch from GUI to the 36-second stimulus-to-action animation. Speak each line as its numbered stage is highlighted; do not read the arrows aloud.]

[01 · 0–6 s · Confirmed TX]
Transactions record food and hazard coordinates.

[02 · 6–12 s · Sensory encoding]
The adapter combines them with body state into sixteen inputs.

[03 · 12–18 s · Neural activity]
MaleCNS updates neural activity, then extracts population averages.

[04 · 18–24 s · Action readout]
Ridge regression predicts rewards for eight directions and rest.

[05 · 24–30 s · Execute movement]
The highest-scoring allowed action updates the fly's coordinates.

[06 · 30–36 s · Record experience]
We store neural features, actions, and rewards to train the readout.

[Return to GUI. Hardware/method lower third; approximately 19 seconds remaining.]

We propose this interface as the Biological Agent Protocol.
We trained the readout with ridge regression on an AMD Ryzen nine, ninety-nine fifty X CPU.
Let's try it again.

## 1:45–2:25 · MOMO and SORA try again

[Normal speed; speak after the movement appears]

The stimulus is confirmed.
MOMO is moving.
And here comes SORA.

This time, they're getting closer to food.

[Same actions · 0.25x replay]

Let's slow that down for a closer look.

MOMO is almost there…
Got it! The counter is up to one.

Now, SORA!
Closer… closer…
And got it!

[Show the counters; return to an explanatory tone]

One food item for MOMO, and one for SORA.
Now, how well does this work across different layouts?

## 2:25–2:50 · What worked—and what remains unresolved

[Recorded validation results]

We also tested twelve previously unseen layouts.
The model collected all twenty-four food items.

But ridge regression on the sensory inputs alone collected twenty-three.
Our hazard-avoidance criterion was not met either.

Running the experiment revealed both working behavior and unresolved problems.

## 2:50–3:15 · Beyond the terrarium

[Separate verified market recording]

We also connected the idea to wallet-based applications.

Here, agents update liquidity offers through the 1inch Aqua Protocol and execute swaps on Uniswap v3.
The transaction receipts show ERC-20 token transfers.

[On-screen label: Test assets · Ethereum fork]

## 3:15–3:40 · Our proposal

[Show the 24-second protocol-design animation. Keep the model credits visible in its footer.]

[0–6 s · IBioAgent]
This is the design we built.
IBioAgent defines the onchain input status.

[6–12 s · IBioAgentStimulus]
IBioAgentStimulus accepts structured stimuli, identified by a schema.

[12–18 s · Framework]
The framework reads those inputs and runs the neural model.

[18–24 s · Applications]
Applications execute the actions.
This is our proposal: the Biological Agent Protocol.

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
