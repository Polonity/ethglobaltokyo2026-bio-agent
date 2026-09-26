# Shared chain API reference

Reader: `services/worker/registry-read.js`; client: `apps/frontend/chain.js`. Anvil and Sepolia share read APIs. Default Anvil URL: `http://127.0.0.1:8798`. HTTP Status submission and health are Anvil-only; manual Sepolia writes use the owner's wallet.

## Conventions

JSON responses use `Cache-Control: no-store`. chainId, agentId, revision, nonce, updatedAt, blockNumber, transactionIndex, and logIndex are **decimal strings**. activity/energy/stimulus are integers. Hashes/addresses are 0x-prefixed hex.

Reads verify the configured chain ID; Anvil additionally verifies client identity and deployment block hash. Config retrieval alone does not prove chain connectivity.

| GET | Main response fields |
| --- | --- |
| `/api/config` | mode=anvil/sepolia, chainId, registryAddress, deployBlock, modelHash, agentIds, worldInput, walletMode, networkName |
| `/api/health` (Anvil only) | status=ok, runtime=browser, mode=anvil, chainConnected=true, registryAddress |
| `/api/chain/snapshot` | blockNumber, blockHash, agents, events, environment |
| `/api/chain/events?after=N&hash=H` | blockNumber, blockHash, events |
| `/api/chain/receipt?hash=H` | stage; after mining, blockNumber and transactionHash |

Snapshot agents contain agentId, owner, modelHash, metadataURI, status, and cause. Reads pin the latest block and match StatusUpdated to the revision. Use the snapshot block number/hash as the first events cursor.

```sh
curl -fsS http://127.0.0.1:8798/api/health
curl -fsS http://127.0.0.1:8798/api/chain/snapshot
```

Events span after+1 to head, ordered by block/transaction/log index. Retain the returned cursor even with no events. Missing or mismatched cursor blocks return HTTP 409 with `{"error":"reorg","reset":true}`. Receipt stages are pending/mined/reverted; mined does not mean applied to an agent.

## Status submission — Anvil only

`POST /api/chain/status` requires same Origin and `Content-Type: application/json`. Example immediately after registration:

```json
{"agentId":"1","expectedRevision":"1","activity":2,"energy":9000,"stimulus":9500}
```

Use the actual latest revision, not a repeated constant. agentId must be string 1/2/3; expectedRevision a decimal string; activity 0/1/2; energy/stimulus integer 0–10000. Body limit: 1024 characters. The Worker preflights with eth_call, estimates gas, and sends from Anvil's unlocked owner.

HTTP 202 response:

```json
{"transactionHash":"0x…","agentId":"1","stage":"submitted"}
```

The real response contains the full hash. Acceptance is not mining or event application. GUI verifies receipts/logs; timeout does not automatically resend.

## Events

Common fields: `chainId, registryAddress, blockNumber, blockHash, transactionHash, transactionIndex, logIndex, name, agentId, eventId, receiptVerified`.

- BioAgentStatusUpdated adds writer and status (activity, energy, stimulus, revision, updatedAt).
- BioAgentStimulusAccepted adds writer, nonce, schema, payloadHash, configuration. World inputs come from Agent #1; dimensions, seed, and hazards are validated.
- environment is the latest valid world event. Missing world TXs stop the foraging snapshot rather than supplying a local default.
- eventId is `chainId:lowercaseRegistryAddress:blockHash:transactionHash:logIndex`.

The current format uses name/status, unlike the proposed shared runtime's eventName/payload/canonicality. Update both ends when extending schemas.

## Errors

| HTTP | Examples | Response |
| --- | --- | --- |
| 400 | Invalid agent, range, cursor, hash | Correct input |
| 403 | Origin, loopback, or owner mismatch | Check connection configuration |
| 409 | RevisionMismatch or RPC error | Refresh and inspect; do not blindly resend |
| 409 + reset | Cursor reorg | Reinitialize from snapshot |
| 413 | Oversized body | Send required fields only |
| 503 | RPC down, deployment/model mismatch, unverified world | Inspect startup/configuration |
| 404 | Unsupported path/method | Check API contract |

Base shape: `{"error":"description"}`. Malformed JSON currently falls through to a general 503; not all invalid input returns 400.

## Initial world transaction

Owner calls `submitStimulus(1, expectedNonce, schema, payload)`. Schema is `keccak256("bioagent.foraging-world.v1")`; payload is UTF-8 [world JSON](../../packages/bio_agent/browser/foraging-world.json). Read `stimulusNonce(1)` separately from Status revision.

Contract checks owner, nonce, and payload length. Shared reader/runtime validate schema and ranges with no local fallback. A new world TX clears previous food. Deployment confirms the initial world after registration and before execution.

## Exclusions

No registration HTTP API, arbitrary RPC forwarding, arbitrary transfers, key-input API, SSE, or server persistence of runtime state. Registration uses Foundry scripts. Do not reuse the unlocked-account signing path for public networks.
