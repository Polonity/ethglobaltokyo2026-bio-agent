# BioAgent contracts — Foundry

Implements the `IBioAgent` / `IBioAgentRegistry` types and `BioAgentRegistry`. Status is an **input** to an agent; internal state and actions are computed offchain.

## Toolchain and layout

- Foundry **v1.8.3** (`forge`, `cast`, `anvil`), Solidity **0.8.30**, EVM **Cancun**.
- Optimizer enabled with 200 runs; see `foundry.toml`.
- `forge-std` v1.9.7 is pinned by a Git submodule and lockfile.
- `src/interfaces/`: shared types, events, custom errors, and operations.
- `src/BioAgentRegistry.sol`: registration and owner-authorized Status updates.
- `test/`: unit, fuzz, and deployment-script tests.
- `script/`: Forge scripts for Sepolia and local deployment.
- `abi/`: generated public ABIs shared by backend and frontend.

Follow the [official Foundry installation guide](https://getfoundry.sh/introduction/installation/), then pin the version with `foundryup --install v1.8.3`. Ensure `forge`, `cast`, and `anvil` are on PATH.

## Build and test

Run from the repository root:

```sh
git submodule update --init --recursive
make contracts-fmt contracts-build contracts-test
make contracts-dry-run
make contracts-check-deployment
make contracts-abi
```

`contracts-dry-run` simulates deployment in a local EVM with Sepolia's chain ID. It neither connects to public Sepolia nor requires a private key.

`contracts-check-deployment` starts a temporary Anvil and checks the RPC-based Forge dry-run: exactly one CREATE is planned, nonce and block number remain unchanged, and the predicted address has no code. It then stops that Anvil process.

If Foundry is not on PATH, use `make ... FORGE=/absolute/path/forge ANVIL=/absolute/path/anvil`. CI runs the same checks with pinned versions and detects ABI drift.

## Types and constraints

`Activity` is Rest=0 / Explore=1 / Forage=2. Energy and stimulus range from 0 to 10000. Initial Status is Rest / 5000 / 0, with revision 1. Updates must supply the current revision; successful updates increment it by one.

Registration emits `BioAgentRegistered` followed by `BioAgentStatusUpdated`. Updates emit `BioAgentStatusUpdated`, including the complete input for that revision.

Anyone may register and becomes the agent's owner. Only that owner may update its Status. `modelHash` must be nonzero; `metadataURI` must contain 1–512 bytes. UTF-8 validity and URI contents are not checked. The base registry has no definition updates, ownership transfer, deletion, administrator, upgrade mechanism, or token issuance.

Deployment alone does not register agents or connect a runtime and GUI. See [contract design](../docs/design/onchain-contracts.md) and [Sepolia setup](../docs/deployment/sepolia.md).

## Deploy the local application

`script/DeployLocalArena.s.sol` supports chain ID 31337 only and creates a registry with three agents. `npm run local:up` starts Anvil, deploys, and serves the GUI. See the [local setup guide](../docs/deployment/local-anvil.md).

## Agent wallet references

`IBioAgentWallet` adds `getAgentWallet` / `setAgentWallet`. An owner can register a wallet address on the same chain, emitting a dedicated event. The initial address is zero. Setting it **does not delegate execution authority**. Wallet creation and ownership verification are separate responsibilities. Existing registries are not automatically upgraded. See [agent and wallet extensions](../docs/design/agent-types-and-wallets.md).

## Experimental stimulus extension

`BioAgentStimulusRegistry` extends the existing registry with schema-tagged inputs and ERC-165 discovery. It does not tokenize agents. See [mailbox semantics](../docs/standards/bio-agent-draft.md). Deployment scripts and demos select their own registry variant; consult the relevant [deployment record](../docs/deployment/sepolia.md) rather than inferring deployed capabilities from an interface file.
