# Biological Agent Protocol — English spoken demo script

This is the primary script for the presenter's own English narration, also used for supporting English captions. The Japanese file is for comprehension only. Approximate 3:25 structure; actual speaking time and subtitle timing must be checked against the human recording. No synthetic voiceover. Bracketed directions are not spoken.

Read one short line at a time and leave room for the GUI. MOMO: MOH-moh. SORA: SOH-rah. Use a calm conversational voice for explanations and a brighter sports-commentary voice for the approach and collection. Do not rush to imitate a professional race caller.

## 0:00–0:25 · What if this fly ran on onchain data?

When I saw this model of a fly's neural circuitry, I had a thought.

What if we turned it into an agent driven by onchain data?

So we built an application.
Meet MOMO—and SORA.

What will these two do when we send them stimuli through transactions?

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

## 0:50–1:30 · The Biological Agent Protocol

[Environment GUI and transaction receipt]

Let me explain the system we built.

Applications provide stimuli.
Food and hazard areas are recorded through transactions.

The framework reads those records and converts them into sensory inputs for the neural circuit.
The individual's state and the model's response inform action selection.
The application executes the action and returns the outcome.

We propose this shared interaction contract as the Biological Agent Protocol.
Neural computation and movement run off-chain.

[Previously completed learning evaluation]

We fixed the directional bias and collected experience across multiple layouts.
Let's try it again.

## 1:30–2:10 · MOMO and SORA try again

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
One food item each.

[Show the counters; return to an explanatory tone]

Recorded stimuli reached the model, and its decisions became actions in the application.
The sensory encoding and action readout are engineered.

## 2:10–2:35 · What worked—and what remains unresolved

[Recorded validation results]

We also tested twelve previously unseen layouts.
The model collected all twenty-four food items.

But a small model without the neural circuit collected twenty-three.
Our hazard-avoidance criterion was not met either.

Running the experiment revealed both working behavior and unresolved problems.

## 2:35–3:00 · Beyond the terrarium

[Separate verified market recording]

We also connected the idea to wallet-based applications.

Here are Aqua offers and Uniswap trades.
Decisions lead to asset operations, with actual token transfers we can inspect.

These are local test transactions.
They do not demonstrate profitability.

## 3:00–3:25 · Our proposal

[Return to the foraging GUI]

It started with a simple idea: a fly driven by onchain data.
From that idea, we built a framework and two applications.

Deliver a stimulus. Turn the response into a decision. Execute an action in an application.

We propose the Biological Agent Protocol as a shared interface for using biologically derived models in applications.

## Editorial notes

- MOMO collects before SORA in the saved run; confirm visible counter changes before placing each line.
- Keep pauses. Do not narrate every movement at normal speed; use the explicitly labelled slow replay for detailed commentary.
- The old failure and revised run are different implementations. Do not imply that a simple retry fixed the issue.
- Model responses do not establish thoughts, feelings, biological realism, or general superiority.
- The market uses EOA signers. Describe it as a wallet integration, not an implemented smart-wallet authorization system.
- The narrative order is editorial, not a claim about when the protocol was first implemented.
