# Pinned source dependencies

Powered by Aqua — © Degensoft Ltd 2025.

- `aqua/src`: unmodified `Aqua.sol`, `interfaces/IAqua.sol`, `libs/Balance.sol` from https://github.com/1inch/aqua at `ef24220ed9647555727b06867bf509cd6959d84b`. License in `aqua/LICENSE` (LicenseRef-Degensoft-Aqua-Source-1.1).
- `solidity-utils/contracts`: unmodified import closure of `SafeERC20.sol` from npm `@1inch/solidity-utils@6.9.9`: two libraries and four interfaces. MIT license copied verbatim from that npm tarball's `LICENSE.md`. Vendored Solidity avoids installing its unrelated Hardhat toolchain; this project compiles using Foundry.
- OpenZeppelin contracts are pinned to `5.4.0` in the root npm lockfile.

Local Aqua integration components added 2026-09-26: `contracts/src/AquaFlyApp.sol`, `services/worker/aqua.js`, `packages/bio_agent/connectome/aqua-controller.js`, `apps/frontend/aqua.*`, related Aqua build/setup/test scripts. Source is available in this repository; these Aqua-specific additions use LicenseRef-Degensoft-Aqua-Source-1.1. Existing independent components retain their notices. No upstream Aqua source has been modified. Build/deployment: `docs/design/aqua-connectome.md`.
