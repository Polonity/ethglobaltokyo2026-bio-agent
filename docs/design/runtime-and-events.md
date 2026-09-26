# Event intake, agent execution, and storage

**Proposal: shared persistent runtime and SSE, not implemented as the pipeline described here.** Local Anvil-to-browser event delivery exists. For current APIs and recovery boundaries, see [local API](../reference/local-api.md) and [architecture](../architecture.md).

## Proposed Status delivery

1. GUI requests an owner-wallet `updateStatus` transaction.
2. Registry updates state and emits `BioAgentStatusUpdated`.
3. The running ChainListener reads registry/topic-filtered logs.
4. Logs are persisted, validated, sorted, and queued by agent ID.
5. Each agent converts Status into inputs at a tick boundary.
6. Runtime persists the source event, application tick, and result.
7. Backend streams SSE updates; GUI interpolates the latest frame.

The registry does not call a runtime. Runtime processes must already exist. Registration must not automatically launch unknown models; the demo hosts configured IDs and allowed implementations.

## Proposed data types

Encode uint256, uint64, chainId, tick, and SSE cursors as decimal strings in JSON. Energy/stimulus remain numbers in 0–10000; do not rely on JavaScript Number for large integers.

| Type             | Required fields                                                                                                                                            |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AgentKey         | chainId, registryAddress, agentId                                                                                                                          |
| ChainLogEnvelope | schemaVersion, chainId, registryAddress, blockNumber, blockHash, transactionHash, transactionIndex, logIndex, eventName, payload, observedAt, canonicality |
| StatusInput      | agentKey, activity, energy, stimulus, revision, updatedAt, causeEventId                                                                                    |
| RuntimeState     | agentKey, sessionId, modelHash, tick, appliedRevision, lastCauseEventId, x, y, heading, speed, activation, action                                          |
| RuntimeFrame     | schemaVersion, frameId, sessionId, generatedAt, agents (RuntimeState array)                                                                                |
| RuntimePresence  | agentKey, state (starting/running/catching_up/offline/error), lastHeartbeatAt, errorCode                                                                   |

Canonicality is observed/confirmed/orphaned. Confirmed means the configured depth, not unconditional finality. Normalize `(chainId, registryAddress, blockHash, transactionHash, logIndex)` into causeEventId for duplicate detection. Coordinates are 0–1, heading is radians, speed is field widths/second, activation is 0–1; reject nonfinite values. Preserve Solidity event names and separately version application schemas.

## Runtime protocol

The proposed Python `BioAgentRuntime` is separate from onchain `IBioAgent`:

```text
initialize(definition, model, seed) -> RuntimeState
apply_status(StatusInput) -> AppliedInput
step(dt, tick) -> RuntimeState
snapshot() -> Checkpoint
restore(Checkpoint) -> RuntimeState
```

AppliedInput records eventId, revision, and tick. Divide energy/stimulus by 10000; pin Activity interpretation to the model version. Continue ticking with the latest conditions between events. Process each agent's queue serially, recording chain order when multiple inputs share a tick.

Initial targets were 20 Hz runtime, 10 Hz streaming, and requestAnimationFrame rendering, subject to load measurement. Replay uses recorded application ticks, fixed dt, seed, and model version, not network arrival time.

## Intake, deduplication, and recovery

- Start with ranged `eth_getLogs` polling; WebSockets may later provide hints.
- Rescan an overlap from saved block number/hash, starting at deployment on first use.
- Sort by blockNumber, transactionIndex, logIndex; registration precedes initial Status.
- Atomically save logs and cursor. Keep application records, checkpoints, and outbox consistent.
- Use at-least-once delivery with per-agent eventId idempotency. Recover from checkpoints plus applied-input records; replace unsaved GUI frames with snapshots.
- Revision gaps put an agent in catching_up until backfilled. Rollback must also rewind duplicate/revision tracking.
- Retain logs while an agent is stopped. Resume from its checkpoint. Missing history requires an explicit new session, not a claim of exact recovery from latest Status alone.

Follow the [Ethereum eth_getLogs API](https://ethereum.github.io/execution-apis/api/methods/eth_getLogs/) for provenance and filtering.

## Confirmation depth and reorgs

The initial demo proposal applies mined inputs provisionally, never at signature or mempool stage. Show provisional application separately from reaching confirmation depth; a conservative mode may wait for depth.

Check rescanned block hashes as well as removed notifications. Find a common ancestor, mark orphaned logs, restore affected agents to earlier checkpoints, replay canonical inputs, and send `runtime.reset` to discard old trails. Stop and resync from deployment if reorgs exceed retention. See [Ethereum JSON-RPC](https://ethereum.org/developers/docs/apis/json-rpc/). Depth, poll interval, and overlap depend on the selected chain.

## Storage proposal

| Table            | Responsibility / identity                                                    |
| ---------------- | ---------------------------------------------------------------------------- |
| agents           | Definition and canonical Status projection per AgentKey                      |
| chain_logs       | Raw topics/data, decoded payload, canonicality per eventId                   |
| chain_cursors    | Last fetched block/hash per chain and registry                               |
| runtime_sessions | Model, seed, dt, starting conditions, status                                 |
| applied_inputs   | Application tick and validity per session/agent/event                        |
| checkpoints      | Internal state per session/agent/tick                                        |
| runtime_frames   | Latest frame and selected recordings, not permanent retention of every frame |
| stream_outbox    | Monotonic cursor for replaying persisted updates                             |

Extend SQLite with migrations. Canonical logs/state govern definitions and inputs; checkpoints govern runtime state; GUI is a projection.

## GUI API proposal

| Endpoint                                 | Content                                                                                 |
| ---------------------------------------- | --------------------------------------------------------------------------------------- |
| GET `/api/agents`                        | Definitions, latest Status, RuntimePresence                                             |
| GET `/api/agents/{agentId}/snapshot`     | RuntimeState, applied revision, cause event                                             |
| GET `/api/events?agentId=...&cursor=...` | Input and execution history                                                             |
| GET `/api/stream`                        | SSE: agent.registered, status.observed/confirmed/reverted, runtime.frame/reset/presence |

v0.1 targets one chain/registry and includes that context in responses. Multi-registry URLs need the full AgentKey. SSE IDs use outbox cursors, not chain logIndex; resume from Last-Event-ID. Outside retention, obtain a consistent snapshot/cursor. Slow clients may lose intermediate frames, never Status/reset messages. Subscribe after the snapshot cursor to avoid gaps.

Wallets write directly to the registry; this proposal has no backend private-key custody API. Show chain persistence separately from runtime application, since a write may succeed while runtime is offline.

Training receives canonical history and execution conditions. It emits manifests/artifacts, selected explicitly through another registration. Automatic onchain result writeback is outside v0.1.
