# Fly Lab GUI

An HTML/CSS/JavaScript Canvas application for observing agent behavior, competition, and learning.

Run `npm run local:up` or `npm run dev` from the repository root to start the chain-connected local demo. See [local setup](../../docs/deployment/local-anvil.md).

`app.js` handles rendering and controls; `chain.js` handles snapshots, events, and transaction progress. Behavior and learning live in `packages/bio_agent/browser/arena.js`. Build output is written to the root `dist/` directory.

## State boundaries

- `/api/config` selects the chain mode.
- Editing or submitting an input does not immediately apply it. Confirmed events update the target agent.
- The runtime runs in the browser tab. Reloading resets transient body/competition state and reloads chain inputs; policy persistence is handled separately.
- JSON export is an experiment record, not a complete environment import/resume feature.
- `?test=1` exposes `window.__arena` / `window.__chain` for browser tests; normal use does not require it.

[GUI guide](../../docs/design/demo-experience.md) · [API](../../docs/reference/local-api.md) · [Model](../../docs/design/fly-arena.md) · [Verification](../../docs/development.md)

## Language

The header supports System (default), English, and Japanese. Switching languages preserves the active run and saves the preference in the browser. See [language behavior and tests](../../docs/i18n.md).
