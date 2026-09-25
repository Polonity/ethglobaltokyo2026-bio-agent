# Shared BioAgent types

`types/index.ts` exports the proposed TypeScript core and two application profiles. These are application/runtime types, not a new Solidity ABI or an NFT/SBT requirement.

- Core: provenance, model descriptor, body/clock, view, checkpoint and learning transition.
- Foraging: environmental conditions, food/hazard inputs, movement/rest and score.
- Market: swap/quote observations, attention, paper orders/fills and unavailable/valued PnL.
- `legacy.ts`: explicit validated helpers for the existing foraging status and actions.

Run `npm run test:types` from the root (Node 22.14+). Examples are synthetic compile-time fixtures, not observed behavior. Full external JSON parsing and runtime integration remain pending; TypeScript types do not replace source validation.

See [type specification and invariants](../../docs/standards/application-types.md).
