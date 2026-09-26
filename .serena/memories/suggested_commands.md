# Suggested commands

Run commands from the repository root unless noted.

- Initial setup: `npm ci`; `git submodule update --init --recursive`.
- Build generated frontend/model/circuit/Aqua assets: `npm run build` (writes `dist/`; do not hand-edit generated files).
- Public-style browser demo: `npm run dev`; default browser check is `npm run test:browser` against port 8797, or set `ARENA_URL=http://127.0.0.1:8797`.
- Local Anvil + 3-agent GUI: `npm run local:up`; defaults are RPC 8545, GUI 8798, inspector 9248. Override with `ANVIL_PORT`, `LOCAL_GUI_PORT`, `LOCAL_INSPECTOR_PORT`, or an in-workspace `LOCAL_STATE_DIR`. Stop with Ctrl-C.
- Local app variants: `npm run local:market` + `npm run test:market`; `npm run local:circuit` + `npm run test:circuit` / `npm run test:circuit:browser`; `npm run local:aqua` + `npm run test:aqua` / `npm run test:aqua:browser`; `npm run local:foraging` + `npm run test:male-learning:browser`.
- Fast Node tests: `npm run test:arena`, `npm run test:agents`, `npm run test:swaps`, `npm run test:body`, `npm run test:paper`, `npm run test:i18n`, `npm run test:types`, `npm run test:male-learning`. These are mostly network-free; type tests also run `tsc`.
- Learning/demo commands: `npm run benchmark:male-learning`, `npm run demo:agents`, `npm run demo:swaps`.
- Formatting: `npm run format:check`; source globs are explicit and do not include every file in the repository.
- Python scaffold: `make dev` (builds then serves 127.0.0.1:8000), `make train`, `make test`. Backend env vars: `HOST`, `PORT`, `BIO_AGENT_DB`; mock API health is `/api/health`.
- Foundry: `make contracts-fmt contracts-build contracts-test`; offline deployment simulation `make contracts-dry-run`; deployment-script check `make contracts-check-deployment`; ABI refresh `make contracts-abi`. Override `FORGE=/absolute/path/forge` and `ANVIL=/absolute/path/anvil` if tools are not on PATH.
- `npm run test:local` mutates/runs a local Anvil and needs `.local/deployment.json`; it is not a public-URL test. Do not run it concurrently with recording/demo sessions.
- Network/public side effects: `npm run deploy` publishes through Cloudflare, `make sepolia-dry-run` needs `contracts/.env` and an RPC but does not broadcast. Treat these as explicit release/deployment operations.