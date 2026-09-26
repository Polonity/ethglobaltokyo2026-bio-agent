# Task completion checks

- Ordinary JavaScript/frontend/runtime changes: run the relevant targeted Node test(s), then `npm run format:check`; run `npm run build` when bundling, generated assets, manifests, or entrypoint wiring is affected.
- Shared TypeScript changes: run `npm run test:types` and `npm run format:check`; update the type specification when invariants change.
- Learning/model/connectome changes: run `npm run test:male-learning`, the applicable browser check, and `npm run benchmark:male-learning` when performance or budget behavior changes. Verify manifest/graph digest checks remain valid.
- Chain/session/local Worker changes: run `npm run build`, start a clean `npm run local:up`, then `npm run test:local`; include the relevant browser-mode test if UI behavior also changed. The local test mutates an ephemeral Anvil and is not a replacement for public deployment checks.
- Solidity/interface/deployment changes: run `make contracts-fmt contracts-build contracts-test`, `make contracts-dry-run`, and `make contracts-check-deployment`; run `make contracts-abi` if ABI-visible output changed, then rebuild/redeploy local state before E2E.
- Python backend/training changes: run `make test`; run `make dev` or `make train` only when the server/training entrypoint behavior is involved, and verify the SQLite path is an intentional temporary/ignored location.
- Browser UI changes: run `npm run build` and the corresponding browser check (`test:browser`, `test:market`, `test:circuit:browser`, `test:aqua:browser`, or `test:male-learning:browser`). Chrome may be selected with `CHROME_PATH`.
- Always finish a scoped change with `git diff --check` and review `git status --short`; do not include generated/local state unless explicitly requested.
- Deployment/release checks are separate: `npm run deploy` publishes to Cloudflare; `make sepolia-dry-run` is RPC-backed but read-only. Do not treat either as ordinary completion checks without explicit release scope.