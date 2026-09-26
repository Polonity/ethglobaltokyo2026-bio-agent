# BioAgent

An experimental platform for agents that use biological neural connectivity—a connectome—to respond to their environment and learn from outcomes.

[Live demo](https://ethglobaltokyo-bio-agent-sepolia.commun-official.workers.dev/?lang=en) · [Documentation](docs/README.md) · [Framework API](packages/bioagent-framework/README.en.md)

## Purpose

We investigate how measured fruit fly neural connectivity can support agent learning and adaptation. Foraging and market applications make inputs, internal state, actions, and learning results observable and allow comparisons with baseline models.

The project connects onchain agent identities and inputs with model provenance, providing a shared foundation for inspecting decisions and managing learned policies across applications.

## Getting started

### Run locally

With Node.js 22.14 or later and npm installed, run these commands from the repository root:

```sh
npm ci
npm run framework:lab
```

Open the [Research Lab](http://127.0.0.1:8826/) to change inputs and explore the **train → evaluate → adopt → save and restore** workflow. This mode does not require a wallet or a running blockchain.

### Connect to a blockchain or run the full model

| Goal | Guide |
| --- | --- |
| Observe inputs and learning in the public demo | [Sepolia Lab](docs/deployment/sepolia.md); no wallet needed to observe |
| Send inputs to agents from a local blockchain | [Local Anvil setup](docs/deployment/local-anvil.md) |
| Run all 166,700 neurons locally | [Full model setup](docs/design/malecns-full-local.md) |

## Architecture

The core flow is **onchain inputs → validation → connectome computation → decisions and learning → application**. In the Anvil and Sepolia foraging environments, all external inputs—including the initial environment, hazards, food, and stimuli—are recorded in transactions. Body state and learning are computed offchain.

| Directory | Main languages | Responsibility |
| --- | --- | --- |
| [contracts/](contracts/README.md) | Solidity | Agent identity, model references, inputs, and permissions |
| [packages/bioagent-framework/](packages/bioagent-framework/README.en.md) | JavaScript | Input validation, learning evaluation and adoption, policy persistence |
| [packages/bio_agent/](packages/bio_agent/README.md) | JavaScript / Python | Reduced browser circuit and local full-neuron computation |
| [packages/shared/](packages/shared/README.md) | TypeScript | Proposed shared data types |
| [apps/](apps/) | JavaScript / HTML / CSS | GUIs for observing behavior and learning |
| [services/](services/) | JavaScript | Workers hosting and input validation; Node.js orchestration of full-neuron execution |

The public demo and JavaScript framework use a reduced circuit with 7 neurons and 19 connections. The full model uses a separate Python runtime. Connectivity comes from measured data; neural dynamics, sensory encoding, and action readout are implemented by this project.

[Runtime boundaries, communication, and storage](docs/architecture.md) · [Layer diagram and API](packages/bioagent-framework/README.en.md#layers) · [Data sources](docs/data-sources.md) · [Experimental results and limitations](docs/research/bioagent-adaptation/README.md)

## Development

```sh
npm run test:framework
```

See the [development guide](docs/development.md) for additional tests, contract development, and deployment instructions.
