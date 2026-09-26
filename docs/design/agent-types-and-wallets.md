# Agent types, price inputs, and wallet references

Historical extension milestone, 2026-09-25. These adapters were added without replacing the existing GUI. Live API configuration, a price-agent GUI, and wallet creation/signing were not connected at this stage.

## Interface boundaries

Solidity `IBioAgent` defines Status reads/writes/events; the registry implements it. It does not run decisions or learning in the EVM. JavaScript `IBioAgentRuntime` is a separate base for `ForagingBioAgent` and `UniswapPriceBioAgent`, not a Solidity inheritance relationship or two per-agent contract deployments.

```text
IBioAgent.sol ← IBioAgentRegistry ← BioAgentRegistry + IBioAgentWallet
IBioAgentRuntime
  ├─ ForagingBioAgent ← prevalidated StatusUpdated
  └─ UniswapPriceBioAgent ← fixed-amount quote with provenance
       → existing Arena: decisions, movement, experience, Q-learning
```

Runtime exposes observe/step/snapshot. Identity includes id, owner, and optional wallet chain/address/verification. Foraging inputs must already have chain/registry/order checks, e.g. from ChainSession. The GUI's ChainSession was not replaced by this class.

## Price observer

`packages/bio_agent/runtime/agents.js`, model `uniswap-price-observer-v1`: compare amountOut for a fixed chain/tokenIn/tokenOut/amountIn. First input and unchanged quotes map to Explore with zero stimulus; increasing output maps to Forage, decreasing to Rest. Energy is a provisional 5000.

Compute integer bps with BigInt: `(newAmountOut - previousAmountOut) * 10000 / previousAmountOut`; clamp absolute stimulus to 0–10000. Decimals cancel only for the same pair/quantity. A fixed-amount quote includes fees/liquidity effects and is not a USD price.

Default freshness is 30 seconds. Reject stale/future/out-of-order inputs; missing/expired data returns waiting/stale without advancing Arena. After a long gap or source change, rebaseline. This mapping is engineered, not learned market timing; scope is observe-only, not buy/sell execution.

## Uniswap source

The [quote API](https://developers.uniswap.org/docs/api-reference/aggregator_quote) requires key, chain/tokens/quantity/swapper. [RPC V3 Quoter](https://developers.uniswap.org/docs/sdks/v3/guides/swapping/quoting) is another approach. Quotes do not execute swaps.

`services/backend/adapters/uniswap-quote.mjs` calls only official `/v1/quote`, same-chain EXACT_INPUT, V3/CLASSIC, rejecting mismatched route/tokens/amount or failures. Live compatibility with a production key/pair was unverified. Keys stay server-side; swapper is quote context, not granted authority. Permit/swap payloads are never executed.

## Provenance

| Source      | Record                                                               |
| ----------- | -------------------------------------------------------------------- |
| chain-log   | chainId, registry, TX, block/log/revision                            |
| uniswap-api | chain, pair, amount, requestId, receive time, query, rawResponseHash |
| fixture     | Explicit fixed test input, never live TX evidence                    |

API observedAt is server receive time, not block time. Raw-response SHA-256 is integrity, not a Uniswap signature/proof. Do not invent TX hashes or mined labels for API data. If later anchoring observations, keep source and anchor provenance separate; this adapter does not automatically write Status.

## Owner and wallet

`getAgentWallet` / `setAgentWallet` and `BioAgentWalletUpdated` add a same-chain reference. Zero means unset/removed; only owner changes it. Wallet changes have a dedicated event and do not increment Status revision or delegate write authority. The address is owner-declared: code, wallet type, ownership/control, and deployment are not verified.

Registration/getAgent tuples and Status events remain compatible through a separate getter. Old deployed registries gain no new functions automatically. This milestone added a reference, not a deployed smart account. Future execution needs explicit chain/token/target/amount/expiry/revocation policies. Owner, wallet, and gas payer are distinct roles.

## Usage and verification

```js
import { fetchUniswapObservation } from './services/backend/adapters/uniswap-quote.mjs';
const observation = await fetchUniswapObservation({
  apiKey: process.env.UNISWAP_API_KEY,
  market: { chainId, tokenIn, tokenOut, amountIn },
  swapper,
});
priceAgent.observe(observation);
priceAgent.step();
```

```solidity
getAgentWallet(uint256 agentId) returns (address)
setAgentWallet(uint256 agentId, address smartWallet)
// event BioAgentWalletUpdated(agentId, previousWallet, smartWallet)
```

```sh
npm run demo:agents
npm run test:agents
make contracts-test
```

The examples' token addresses/TXs are fixtures. Verified: foraging adapter, price mapping, runtime application, duplicates/freshness/order/pair/quantity, quote-only HTTP, wallet permissions/events, and Status separation (19 Foundry and four runtime tests at this milestone).

Unverified then: live API, token metadata, scheduled collection/persistence, price GUI, wallet deployment/signing/balances. Configure chain, pair, amountIn, swapper, and API key for a real connection.
