# BioAgent system design v0.1

This directory includes historical design proposals as well as implementation guides. The original v0.1 milestone implemented registry types, events, Foundry tests, and a three-agent Anvil/Workers GUI. Its proposed shared runtime, persistence, and SSE flow are not a description of the current deployed architecture. See [current architecture](../architecture.md) and [Sepolia](../deployment/sepolia.md).

## Intended experience

A wallet records an agent's Status onchain. A running agent receives the event and updates its internal state and actions. The GUI shows agents and lets viewers trace behavior changes to transactions.

## Design boundaries

1. `IBioAgent` defines identity-related inputs, Status operations, and events.
2. `BioAgentRegistry` stores definitions and the latest Status.
3. A proposed persistent runtime routes registry events to the correct agent.
4. A proposed backend stores inputs/results and streams them to the GUI.
5. The GUI interpolates runtime positions/actions for rendering.

The existing browser path polls local Worker APIs and runs Arena at 5 Hz. The shared Runtime → Backend → SSE path remains a proposal. The initial 24-agent target was also a proposal, distinct from the historical three-agent local and twelve-agent browser modes.

| Topic        | v0.1 design                                                                     |
| ------------ | ------------------------------------------------------------------------------- |
| Chain        | Ethereum Sepolia (11155111); Foundry/Anvil locally                              |
| Deployment   | One registry containing multiple agent records                                  |
| Identity     | `(chainId, registryAddress, agentId)`                                           |
| IBioAgent    | Onchain Status interface; separate offchain runtime contract                    |
| Status       | External conditions/stimuli, distinct from computed RuntimeState                |
| Authority    | Registering owner; no ownership transfer or delegated writes in the base design |
| Event intake | Shared ChainListener routes inputs to agents                                    |
| GUI          | Proposed runtime/backend/SSE pipeline with continuous browser rendering         |
| Learning     | Separate from event delivery; pin model versions and retain replayable inputs   |

## Documents and implementation mapping

- [Types, registry, and events](onchain-contracts.md)
- [Proposed event processing and storage](runtime-and-events.md)
- [GUI demonstration](demo-experience.md)
- `packages/bio_agent/step`: scaffold model to evolve into a stateful runtime.
- `packages/shared/Stimulus`: proposed provenance-aware event inputs.
- `packages/training`: training/evaluation using recorded transitions.
- `services/backend`: proposed storage/read API/SSE responsibilities.
- `apps/frontend`: agent display, Status controls, and transaction/application feedback.
- `contracts/`: Solidity interfaces, registry, tests, scripts, and generated ABIs.

The original proposal left RPC/wallet/confirmation settings, initial model and mappings, and shared-runtime load targets to later implementation. Sponsor APIs and prize requirements do not define these base interfaces.

[Contract development](../../contracts/README.md) · [Foraging](fly-arena.md) · [Local chain setup](../deployment/local-anvil.md)

## Current profiles and applications

The [ERC-style draft](../standards/bio-agent-draft.md) defines an ordinary registry and schema-tagged stimulus extension. NFT/SBT experiment code was removed. The draft is unsubmitted and unnumbered; it claims neither ERC-8004 compliance nor execution proofs.

See [design direction](../standards/bioagent-design-direction.md), [application types](../standards/application-types.md), [embodied foraging](embodied-foraging.md), [Uniswap market](local-market-app.md), and [submission index](../submission/README.md). Existing foraging ABI support is distinct from interoperability across the whole proposed profile.
