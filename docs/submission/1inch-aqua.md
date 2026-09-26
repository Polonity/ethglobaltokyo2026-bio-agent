# 1inch submission — BioAgent Aqua

The later [four-agent shared market](../apps/shared-market/README.md) connects two Aqua makers and two traders using the same ERC20 pair on 8814. See the [current presenter kit](presenter-kit/README.md). The evidence here concerns the earlier two-agent8813 demo.

**MOMO/SORA use MaleCNS-derived decisions to update two strategies sharing one self-custodial wallet, with actual test-token settlement against official Ethereum Aqua on a local fork.**

## Evidence

- [Repository](https://github.com/Polonity/ethglobaltokyo2026-bio-agent).
- [61.04-second English GUI demo](evidence/aqua-current-demo-en.mp4), [verification](evidence/aqua-current-demo-verification.json).
- [Initial46.84-second evidence recording](evidence/aqua-official-fork-en.mp4).
- Ethereum fork block**26, 058, 941**, [block/code hashes](evidence/upstream.json).
- Actual GUI: 166, 700 neurons per agent, 19 steps, 10 swaps, 70 ship/dock events.
- Transfer logs reconciled against maker/taker balances; representative trace: safeBalances→push→pull. [Verification](evidence/verification.json).
- Six official-deployment fork tests passed. [Log](evidence/foundry-fork-tests.txt).
- [Recorded readout policies](evidence/aqua-policies.json); no need to distribute the original training database.

![Two agents selecting official Aqua strategies](evidence/aqua-live-en.png)
![Actual ERC20 transfers](evidence/token-transfers-en.png)

[Counterparties, currencies, rates, and profit boundaries](../design/aqua-market-flow.md).

## Submission description

BioAgent Aqua turns measured biological connectivity into an onchain liquidity controller. MOMO and SORA each run a model using all 166, 700 classified MaleCNS neurons. Application-specific learned readouts choose a tight offer, a wide offer, or withdrawal. The two strategies share a single maker wallet through Aqua's virtual balances; shipping an offer does not escrow the wallet's tokens.

Our custom AquaFlyApp binds each strategy to an agent identity, an input revision and a policy digest. A new confirmed stimulus invalidates an old revision. Updates dock the previous strategy and ship a new immutable strategy. Accepted test fills settle atomically through the official Aqua contract's push/pull functions.

The demo uses the canonical Ethereum Aqua deployment, 0x1111113ccf1426a8e30e2bff5e005d929bf6a90a, on an Anvil local fork. The UI shows the selected strategies and opens receipts with ERC20 transfers. Our verification reconciles those transfers against maker/taker balances and traces the call into official Aqua. Foundry tests cover shared liquidity, withdrawal, stale input rejection, insufficient funds, immutable strategies and slippage/identity checks.

This is an engineered research prototype: market stimuli, taker behavior and the test-token exchange rate are controlled. Measured connectivity is real; dynamics, sensory mappings and motor readouts are engineered. Saved learned policies are reused in the recorded demo. We do not claim biological fidelity, profitable market making, mainnet trading, or SwapVM integration.

## Requirement mapping

[Official prize page](https://ethglobal.com/events/tokyo2026/prizes#1inch), checked2026-09-26; this is the recorded review, not a fresh eligibility determination.

| Requirement                                        | Implementation/evidence                                                                                                                     |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Demonstrate an Aqua DeFi position through tests/UI | Two same-wallet strategies with 30/800 bps/withdraw, bound to agent/revision/policy; services/full-apps/aqua.mjs, chain.mjs, AquaFlyApp.sol |
| Use official Aqua/SwapVM                           | Fork canonical Ethereum Aqua in place; do not redeploy/etch its core. services/full-apps/fork.mjs plus upstream block/codeHash              |
| Show onchain token movement; local fork allowed    | Actual GUI fill, receipt Transfers, balance reconciliation, push/pull trace via test: submission: aqua                                      |
| Appropriate Git history                            | Incremental implementation/verification since September25; inspect git log                                                                  |
| SwapVM bonus                                       | Not implemented; custom AquaFlyApp must not be presented as SwapVM                                                                          |

Judges decide sophistication and awards. This is revision-consistent learned selection of fixed-pair virtual-liquidity strategies, not MEV protection or a new AMM formula. Choose the event track according to registration and disclose reused code/data.

## Official deployment checks

Use the [official deployment](https://github.com/1inch/aqua#deployments), not the old0x499943… reference or fresh-Anvil Aqua addresses. Startup records Ethereum chain ID, fixed block hash, canonical runtime code hash, and verifies the actual fork. Reject empty/wrong code or block. Real ship/dock/push/pull and Foundry verify SDK/ABI compatibility. No public-chain writes occur.

## Reproduce

Prepare Node dependencies, Foundry, [full MaleCNS/Python](../design/malecns-full-local.md), Chrome, Playwright, and ffmpeg.

```sh
npm ci
npm run submission:aqua
# Another terminal:
npm run test:submission:aqua
```

GUI: http://127.0.0.1:8813/aqua. Anvil 18551, chain 31337, Ethereum fork. State/artifacts: `.local/aqua-fork/`, `artifacts/aqua-fork/`. Older integrated apps remain8812/18550 with separate state/DB.

First startup backs up an existing training DB where available. If no adopted Aqua policy exists, restore bundled readouts after brain/artifact hash checks; never overwrite existing adopted policies. This is reuse, not retraining.

AQUA_UPSTREAM_RPC selects an archive-capable RPC (default public dRPC); omit keys from evidence. AQUA_FORK_BLOCK pins a block, otherwise finalized is fetched/recorded at startup. Occupied ports abort startup; Ctrl-C stops owned children.

This GUI is Aqua-only and consumes confirmed Swap history generated in a local V3 test pool, not a real mainnet time series. Historical quote limitations for new V3 bytecode on the fork leave older paper trading on 8812; Aqua evidence comes from current fork TXs.

## Short demonstration

Show two agents/one wallet, start autonomous execution, pause and open Evidence, identify the fork and official address, open a successful fill's Actual token transfers, and distinguish Aqua settlement from BioAgent strategy choice. Local TXs are not on Etherscan. Stop pauses inference, not all offers; updates dock then ship. Independent tests cover withdrawal, stale inputs, insufficient funds, immutability, and slippage/identity.

## Outputs

`test:submission:aqua` runs six fork tests, GUI operation, balance reconciliation, and a representative trace. Under `artifacts/aqua-fork/`: aqua-official-fork-en.mp4, verification.json, upstream.json, foundry-fork-tests.txt, and English screenshots. The checked snapshot is in `docs/submission/evidence/`. Keep bundled evidence aligned when replacing it after a new run. No form submission is included.

Powered by Aqua — © Degensoft Ltd2025. MaleCNS: FlyEM / HHMI Janelia and dataset contributors; see project attribution.
