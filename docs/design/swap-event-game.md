# Swap-event agents — initial fixture and verification

Historical milestone, 2026-09-26. The later [real Uniswap market](local-market-app.md) is separate; existing foraging deployments were preserved.

```text
V3-format Swap → configured RPC / receipt / canonical block / confirmations
  → fixed-pool sqrtPriceX96 change → owner-submitted schema stimulus
  → BioAgentStimulusAccepted → runtime verifies original receipt
  → three independent observer runtimes
```

Acceptance onchain and offchain reaction are distinct. Market adapters are optional application profiles, not required ERC functionality. Body computation belongs offchain; it was not part of this initial fixture.

## Implemented

`readSwapReceipt` checks V3 ABI, chain/pool, successful receipt, canonical block, and confirmation depth. `UniswapSwapBioAgent` computes same-pool integer price changes: baseline on first input/long gaps, curious on rises, cautious on falls. It maps into Arena inputs, not learned trading. Duplicates are ignored; reversed order/conflicting same-height hashes are rejected; stale input pauses ticks.

The [stimulus registry](../standards/bio-agent-draft.md) receives three price events × three agents = nine input TXs in an isolated test.

Spot price in base units is sqrtPriceX96²/2¹⁹². Same-pool relative changes cancel decimals; this is not USD, executable size-specific price, or profit probability. Display requires token metadata and explicit quote direction.

## Market stimulus v1

Schema: keccak256(UTF8("bioagent.uniswap-v3-swap.v1")). Payload: `abi.encode(uint256 sourceChainId, address pool, bytes32 sourceBlockHash, bytes32 sourceTransactionHash, uint256 logIndex, uint160 sqrtPriceX96)`. payloadHash=keccak256(payload); mailbox nonce orders each agent's inputs.

Runtime rechecks the original receipt/log/pool/block/price on the source chain and derives block number, transaction index, and timestamp. Deduplicate by chain/pool/blockHash/txHash/logIndex. Default freshness60 seconds and confirmations are operational settings, not universal ERC requirements. Mailbox acceptance alone does not verify Uniswap provenance.

## Reproduce

```sh
npm ci
forge test --root contracts
npm run test:swaps
npm run demo:swaps
```

FORGE/ANVIL accept absolute paths. The script owns Anvil 18545 and stops only that process; it refuses an occupied port and does not use GUI 8545. Output: `artifacts/swap-demo/evidence.json` with registry, schema, source/input TXs, reactions, and positions.

Recorded sequence: baseline → curious (+2099 bps) → cautious (−1735 bps), verified for three agents, including fixed-point rounding. **SwapEventFixture emits synthetic events, not actual Uniswap pool swaps.** Transactions/receipts are real local EVM operations but not evidence of a live Uniswap integration or different policy quality.

## Remaining work at this milestone

Resolve/verify a canonical factory pool and token metadata; persist polling cursors and duplicate caches; implement reconnect/checkpoint reorg replay; build a resident source→signer→mailbox→runtime service; display source Swap versus input TX separately; implement paper broker/ledger/cost evaluation; deploy public test infrastructure only in its explicitly authorized scope. The later market guide records subsequent progress.

NFT/SBT experiments were removed and this demo moved to the ordinary stimulus registry. The proposed distinction is model provenance and stimulus/state/learning semantics, not tokenization. See [design direction](../standards/bioagent-design-direction.md) and [thesis](../submission/bioagent-thesis.md).

[Swap ABI](https://github.com/Uniswap/v3-core/blob/main/contracts/interfaces/pool/IUniswapV3PoolEvents.sol) · [Deployments](https://developers.uniswap.org/deployments) · [ERC-721](https://eips.ethereum.org/EIPS/eip-721) · [ERC-5192](https://eips.ethereum.org/EIPS/eip-5192) · [ERC-8004](https://eips.ethereum.org/EIPS/eip-8004)
