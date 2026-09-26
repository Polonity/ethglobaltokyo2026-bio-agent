# Technology stack

- Root package: private npm package `ethglobaltokyo-bio-agent`, ESM (`"type": "module"`), lockfile `package-lock.json`; no npm workspace configuration.
- Node: documentation requires Node.js 22+; TypeScript type tests require Node 22.14+ for `--experimental-strip-types`.
- JavaScript build: esbuild 0.28.2 bundles frontend entrypoints to `dist/`; Prettier 3.9.9 checks selected JS/CSS/HTML; Playwright 1.63.0 drives browser checks.
- Runtime dependencies: ethers 6.17.0, 1inch Aqua SDK 0.3.4, 1inch SDK core 0.1.5. Wrangler 4.140.0 provides local/public Cloudflare Worker tooling.
- TypeScript: 5.9.3, strict NodeNext config in `packages/shared/tsconfig.json`, no emit, exact optional properties and unchecked indexed access enabled.
- Cloudflare: `wrangler.jsonc` publishes `services/worker/index.js` with `dist/` assets; local Anvil setup generates a separate `.local/wrangler.json`.
- Python: 3.11+ scaffold, standard-library HTTP server and SQLite; entrypoints are `python -m services.backend`, `python -m packages.training`, and unittest discovery.
- Solidity/Foundry: Foundry v1.8.3, Solidity 0.8.30, EVM Cancun, optimizer enabled with 200 runs; forge-std v1.9.7 is pinned as a git submodule/lockfile. Requires `forge`, `cast`, and `anvil`.
- Contract dependencies include OpenZeppelin 5.4.0 and Uniswap V3 core 1.0.1. Contract outputs/cache/broadcast files are generated and ignored.
- Optional tooling: Chrome for Playwright/browser checks; ffmpeg for recording demos. Cloudflare/Sepolia secrets stay in ignored env files and are never committed.