# Shared chain reads and asset delivery

| Implementation | Responsibility |
| --- | --- |
| `registry-read.js` | Shared snapshot, event, and receipt verification for Anvil and Sepolia |
| `rpc-read.js` | Batch independent reads to reduce Worker RPC requests |
| `local.js` | Anvil-only connection and signing; configured by `local:up` |
| `index.js` | Static assets for the local Worker |
| `../sepolia/worker.js` | Public Sepolia API and shared assets |
| `../sepolia/scheduler.js` | Hourly checks and budget-limited stimulus TXs, at least one hour apart |

Public configuration is in `wrangler.sepolia.jsonc`. The local unlocked-account signing API is not exposed publicly. Behavior and learning execute in the browser.

[Local setup](../../docs/deployment/local-anvil.md) · [Sepolia](../../docs/deployment/sepolia.md) · [Input architecture](../../docs/architecture.md)
