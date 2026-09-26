# External protocol integrations

Implementation details, partner proposals, and submission material are collected here. See the [project README](../README.md) for the overview and usage.

## 1inch Aqua

Biologically derived circuit decisions control liquidity offers, changes, and withdrawals from a self-custodial wallet. In the full-neuron shared market, two agents share one maker wallet and settle test tokens against official Aqua contracts on a local Ethereum fork.

- [Shared market operation, implementation, and settlement checks](apps/shared-market/README.md)
- [Two-agent setup, official deployment verification, and submission requirements](submission/1inch-aqua.md)
- [Lightweight browser design and setup](design/aqua-connectome.md)
- [Funds, liquidity, and rewards](design/aqua-market-flow.md)

**Powered by Aqua — © Degensoft Ltd 2025.**

## Uniswap

The project uses locally deployed V3 core and a custom router. In the shared market, ordinary execution code compares executable quotes after the agent chooses an action, then swaps actual test tokens. The older Market Meadow uses real swaps to generate price inputs but evaluates agent trades on paper.

- [Shared-market trades and limitations](apps/shared-market/README.md)
- [Market Meadow and paper evaluation](design/local-market-app.md)
- [Japanese/English proposals and meeting material](uniswap-proposal/README.md)

These integrations enable model comparison; they do not prove increased users, volume, or profit. See [research findings](research/bioagent-adaptation/README.md).

## Presentation and submission

- [Bilingual videos, Q&A, and evidence](submission/presenter-kit/README.md)
- [Submission explanations and verification index](submission/README.md)
- [Project explanation slides](presentation/README.md)

Distinguish historical proposals from the current implementation. Check each document's environment and verification date before submission.
