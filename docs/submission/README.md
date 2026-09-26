# BioAgent — submission materials

**Purpose: build a framework for biologically derived decision models, with inspectable onchain inputs and measurable learning/resource comparisons.** Biological performance superiority remains unproven.

## Start here

[Presenter kit](presenter-kit/README.md) · [Documentary and human narration](presenter-kit/documentary-production.md) · [Purpose](bioagent-thesis.md)

| Material                              | English                                                                             | Japanese                                                                            |
| ------------------------------------- | ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Six explanation slides + architecture | [PDF](presenter-kit/explanation-en.pdf) · [PPTX](presenter-kit/explanation-en.pptx) | [PDF](presenter-kit/explanation-ja.pdf) · [PPTX](presenter-kit/explanation-ja.pptx) |
| Walkthrough                           | [Script](presenter-kit/walkthrough-en.md)                                           | [Script](presenter-kit/walkthrough-ja.md)                                           |
| Four-page Q&A                         | [PDF](presenter-kit/qa-cheatsheet-en.pdf)                                           | [PDF](presenter-kit/qa-cheatsheet-ja.pdf)                                           |
| Historical57.1-second cut             | [MP4](presenter-kit/bioagent-submission-en.mp4)                                     | [MP4](presenter-kit/bioagent-submission-ja.mp4)                                     |

The short historical cut is not the final2–4-minute submission. Use the documentary production page for the current narrated edition.

## Explanation sequence

Purpose → TX-defined environment → encoded inputs and decisions → experience and candidate comparison → evidence and limitations. Separate working integration from controlled tests of effectiveness. For the documentary's protocol-focused narrative, use the [English script](presenter-kit/documentary-script-en.md).

## Demo boundaries

[English public demo](https://ethglobaltokyo-bio-agent-sepolia.commun-official.workers.dev/?lang=en) · [Japanese](https://ethglobaltokyo-bio-agent-sepolia.commun-official.workers.dev/?lang=ja)

| Track                 | Implementation/evidence                                                                                                                                                                               |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Shared Fly Lab        | Sepolia, 7 neurons/19 edges, 3 agents; same UI/Q-learning as Anvil. World/hazard/stimulus/food inputs are TXs; body/consumption/decisions/learning are offchain. [Verification](judge-demo-review.md) |
| Full-neuron recording | 166, 700 neurons per agent; two-agent foraging, then four-agent market. Historical take added2 Aqua and25 V3 settlements/readout updates. [Capture evidence](presenter-kit/capture-evidence.json)     |
| Independent research  | Synthetic foraging with separate controls; reward improved, direct-input superiority unproven. [Results](../research/bioagent-adaptation/README.md)                                                   |

Public Sepolia sends no Aqua/Uniswap orders. Full Python selection, market online adaptation, independent JS framework learning, and public Q-learning are distinct implementations. Long waits are cut; included actions are not sped up. Explicit slow-motion replay is labeled.

Public observation/learning needs no wallet; manual TXs require the owner. Scheduled owner-EOA writes check hourly, with at least one hour between sends. A short presentation uses existing TX evidence rather than waiting for Cron. [Operations/budget](../deployment/sepolia.md).

## Supporting material

- [AI comparison: hypotheses and measurements](presenter-kit/ai-agent-comparison.md)
- [Full shared market](../apps/shared-market/README.md)
- [Independent JS framework](../../packages/bioagent-framework/README.md)
- [Runtime boundaries and languages](../architecture.md)
- [1inch Aqua evidence](1inch-aqua.md)
- [Earlier full-app acceptance](full-apps-acceptance.md)

External forms have not been submitted by these workflows. Check official requirements when submitting. This is a research prototype/profile proposal, not an approved standard or production performance guarantee.
