# Who trades in Aqua and Uniswap?

Updated 2026-09-26. [The four-agent integrated market](../apps/shared-market/README.md) runs on 8814. This page records the older 8812/8813 demos and the integration plan that followed.

## Original demos

| Role | Actual behavior |
| --- | --- |
| Uniswap input generation | Programmed NECTAR/POLLEN swaps on a local V3 test pool; Aqua replays saved Swap history |
| MOMO/SORA | Two offer strategies sharing one maker wallet; MaleCNS/readout chooses tight/wide/withdraw. They are not each other's counterparties |
| Counterparty | Separate test-bot taker accepts tight offers, and wide offers only when absolute observed price change is at least 2%; not external demand |
| Aqua settlement | Actual swaps of separate NECTAR-full/POLLEN-full test tokens at a fixed 1:1 reference less spread, not the current Uniswap exchange rate |
| Paper trading | Virtual accounts using V3 quotes; agent orders neither reach the chain nor Aqua |

NECTAR/POLLEN are project test currencies, not ETH/cash. Similarly named Aqua and Uniswap tokens in the old modes have different ERC20 addresses. UI reads actual symbols because deployment addresses determine ordering.

## Offers, fills, and profit

Shipping an offer does not earn revenue or remove funds from the maker wallet. Accepted settlement moves tokens through Aqua push/pull. A fill does not imply positive net profit after inventory changes, price movement, and costs; ship/dock also consume gas.

The old points metric sums **per-fill balance changes valued using another pair's price ratio**. It is not whole-wallet PnL after gas. No fill means no added fill score. Internal maker/taker trades do not by themselves create external value; aggregate accounting matters.

The goal is to connect circuit decisions to official Aqua strategies and settlement, not prove public demand, profitability, or arbitrage.

## Four-agent integration plan

The basic flow is now implemented on 8814:

1. Use the same two ERC20 addresses for Aqua and Uniswap.
2. Separate maker offer policies from taker trading wallets.
3. Compare same-amount, same-time executable quotes and trade only a valid route; otherwise wait.
4. Replace the old fixed 1:1 quote with a reference-price/spread quote, preserving freshness, minOut, inventory, and order caps.
5. Feed fills/inventory into subsequent inputs and report participant/aggregate valuations, costs, and unfilled offers separately.
6. Include a zero-order control; assess learning separately from integration success.

A target-holdings demand bot remains artificial demand, not user acquisition or mainnet adoption.

## UI and code

The short main-screen note and Who is trading? dialog explain roles in both languages. Details remain in the dialog.

- `services/full-apps/aqua.mjs`: replay, taker acceptance, proxy rewards.
- `services/full-apps/chain.mjs`: taker wallet, ship/dock, swaps.
- `contracts/src/AquaFlyApp.sol`: fixed-reference quotes, revision checks, push/pull.
- `services/full-apps/market.mjs`: paper accounts.

[Official Aqua architecture](https://github.com/1inch/aqua#architecture) · [Submission evidence](../submission/1inch-aqua.md)
