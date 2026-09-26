# Development and verification

## Setup

Use Node.js22+, npm, Foundry forge/anvil, Python3.11+ for scaffold tests, Google Chrome for browser checks, and ffmpeg for recordings. Unless stated otherwise, run from the repository root.

```sh
npm ci
git submodule update --init --recursive
npm run local:up
```

[Local setup](deployment/local-anvil.md) covers tools, ports, and shutdown.

| Change | Main location | Check |
| --- | --- | --- |
| Solidity types/authority/state | contracts/src/ | Foundry, ABI generation, local E2E |
| Local RPC/API | services/worker/local.js | Local E2E |
| Event application/reconnect | apps/frontend/chain.js | E2E, reload/reorg |
| Decisions/rewards/learning | packages/bio_agent/browser/arena.js | Arena tests, real browser |
| GUI | apps/frontend/ | Build and relevant browser mode |
| Mock history persistence | services/backend/ | Python tests |

After contract changes run `make contracts-abi`. Existing deployed code does not update automatically; restart/redeploy the selected local instance and verify new configuration.

## Commands and side effects

| Command | Scope | Side effects |
| --- | --- | --- |
| npm run build | Assets/manifests | Rewrites dist |
| npm run format:check | JS/CSS/HTML formatting | Read-only |
| npm run test:arena | Behavior/learning/reproducibility | No network |
| make contracts-build contracts-test contracts-fmt | Solidity | No public transactions |
| make contracts-dry-run | Offline deployment simulation | No Sepolia writes |
| make contracts-check-deployment | Deployment script | Dedicated temporary Anvil |
| make test | Python models/storage | Temporary data |
| npm run test:local | GUI→TX→logs→behavior/resync | Changes running Anvil |
| npm run test:browser | Shared GUI real-TX path | Same local-chain scope |
| node scripts/record-demo.mjs | Three-agent recording | Status writes; artifact replacement |

Browser tests accept CHROME_PATH. Local tests read `.local/deployment.json`, reject public URLs, and use automine/snapshot/revert; do not run during presentations/recordings. `npm run dev` starts the same Anvil-connected demo as local:up. `npm run test:sepolia:public` reads the public site without chain writes.

Health proves connectivity only; verify actual input application/behavior separately. Record both check results and their scope.

## Configuration and outputs

| Path | Purpose |
| --- | --- |
| .local/deployment.json | Running registry/deployment block/owner/model hash |
| .local/wrangler.json | Local Worker configuration |
| .local/forge.log | Deployment log |
| wrangler.sepolia.jsonc | Public Worker configuration, separate from local writes |
| contracts/.env | Contract deployment configuration |
| artifacts/ | Git-ignored screenshots/videos/evidence |
| data/ | Git-ignored Python DB/training artifacts |

Root Cloudflare credentials are unnecessary for local startup. Never put keys or credential values in docs, captures, or commits.

## Handoff

Choose the affected mode/storage, update code and relevant docs together, run appropriate tests and real interactions, inspect `git diff --check`/diff, and commit coherent small changes. ABI/manifest updates affect both contracts and clients. A changed exact-byte manifest hash will not match old registrations.

Default documentation is English; keep intentional Japanese/bilingual editions explicitly named. `npm run docs:apps` must regenerate English default guides.

## Evidence for broader milestones

Sepolia integration needs a traceable signature→receipt→log→input path including conflicts/rejection. Persistent runtimes need execution without a browser and restart recovery from saved inputs/checkpoints. Shared observation needs matching sessions/state in multiple browsers. Model claims need pinned provenance/mappings and reproducible computation. Learning claims need evaluations outside candidate-selection courses.

These are evidence criteria, not assertions that every milestone is complete. Public deployment is separate from development tests; follow [Workers](deployment/workers.md) and [Sepolia](deployment/sepolia.md).
