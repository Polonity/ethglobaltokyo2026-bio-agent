# Shared Fly Lab — judge-demo verification

Recorded2026-09-26. [English](https://ethglobaltokyo-bio-agent-sepolia.commun-official.workers.dev/?lang=en) · [Japanese](https://ethglobaltokyo-bio-agent-sepolia.commun-official.workers.dev/?lang=ja).

Initial world, hazards, stimuli, and added food are tied to TXs. Anvil/Sepolia share UI and decision/learning code. This demonstrates integration, not biological superiority.

| Check         | Observed result                                                                                        |
| ------------- | ------------------------------------------------------------------------------------------------------ |
| World update  | Hazards remain unchanged while pending; new position/radius applies after confirmation                 |
| Food addition | One food after confirmed positive stimulus; none pending or duplicated                                 |
| Consumption   | Removes food without refill; consumption history persisted                                             |
| Missing world | Stops rather than substituting synthetic defaults                                                      |
| Learning      | Uses a confirmed-world copy without modifying the visible world                                        |
| Full runtime  | Full166, 700-neuron and7-neuron checks each used four steps, TX-derived hazards, and two stimulus TXs  |
| Public page   | English/Japanese, 390 px mobile, no JS exceptions; HTML/CSS/JS byte-match shared build                 |
| Scheduled TX  | The real TX below increased open-page food/history3→4                                                  |
| Retry         | Same-period retry returned the same hash; interruptions/restarts/concurrency tested on dedicated Anvil |

## Public-chain evidence

- [World TX](https://sepolia.etherscan.io/tx/0xbe67b3bb2e1e2ed1a84a1582a8cfa4f7ccd9afa522e0a6f916a93c8a7a6542dc).
- [Scheduled TX](https://sepolia.etherscan.io/tx/0x48fdd866927b1fa4b4202c877f88e8e630def1f89d944ecfb6f849700c9a77bd): block 11785418, gas34, 209, fee0.000034342273782621 Sepolia ETH.
- Signer:`0x0d01a92bae0E01754f7102466936397F609D67C3`; recorded post-check balance0.016363387080355746 ETH, not a live balance quote.
- Hourly checks, at least one-hour send interval, configured24-hour maximum0.00432 ETH. No completed24-hour endurance test.

## Scope and reproduction

External environment inputs are onchain; body/position/learning are computed internal state. Food coordinates derive from TX hash and recorded seed. Consumption/learning are not written back onchain and bodies are not synchronized across browsers.

Public uses the reduced model; the submission uses local full-neuron execution. Do not reuse old dedicated-Sepolia learning numbers as measurements of the current shared UI. [Research](../research/bioagent-adaptation/README.md) is independent.

```sh
npm run local:up
# Another terminal:
npm run test:local
npm run test:sepolia
npm run test:sepolia:public
```

[Summary JSON](sepolia-evidence.json). Raw outputs: `artifacts/local-chain/verification.json`, `artifacts/sepolia/shared-ui-public/`, `cron-verification.json`, and `full-runtime-environment.json`. No dependency on the removed old audit script.

[Public walkthrough](presenter-kit/public-walkthrough.json) opened environment evidence, switched languages, and completed learning without a wallet or TX submission. Replay score13.8943→13.8401 rejected the candidate. This verifies the comparison mechanism, not a new performance experiment. Assets matched shared build; English copy and390 px layout were checked. Scripts: [English](presenter-kit/walkthrough-en.md) / [Japanese](presenter-kit/walkthrough-ja.md).
