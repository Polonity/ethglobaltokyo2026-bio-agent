# BioAgent terrarium artwork v1

Created 2026-09-23 with the built-in **image_gen** tool, explicitly requested for the game's visual presentation. Original PNGs are retained without cropping, recoloring, or replacing the generated alpha. Exact production prompts are in `provenance.json`.

- `terrarium.png`: 1536×1024 illustrated moss habitat. Used in the game header, actual World, and paired memory-walk arenas.
- `bioagent.png`: 1254×1254 transparent fruit-fly character. Used as the specimen portrait and moving character. In the World it follows actual position and heading; in the walk replay its direction follows sampled trajectory segments.
- `sugar-crystal.png`: 1254×1254 transparent leaf-and-sugar pickup. Displayed at actual FOOD stimulus coordinates.

The background is decorative. Mushrooms, leaves and beads do not create stimuli or physical obstacles. Sprite size is for legibility, not the simulated contact radius. Light rings use actual sensory channel intensity. No growth score or model result is inferred from the illustrations. No brand or infrastructure identities were renamed.

Integration: `frontend/src/game-assets.ts`, `main.ts`, `growth.ts`, `style.css`, and `index.html`. Keep these original assets available when building; Vite copies `public/assets` into the distributable.

Verification: TypeScript/Vite build; browser start/pause on a new observation run; memory-walk replay; all three images decoded; both sprite corner alpha values are zero; 390px layout without horizontal overflow; no browser JavaScript errors. Visual review of desktop/mobile captures caught and corrected narrow heading wrapping. Browser evidence is saved under `artifacts/local-verification/game-art/`.

## Copy used in the full-population GUI

Restored unchanged into `services/full-apps/assets/` on 2026-09-26. The local server serves these files at `/assets/`; `experience.mjs` draws the new cute fly and original food sprites at runtime coordinates. `market-garden-v1.png` and `aqua-garden-v1.png` were generated with built-in image_gen for the new market and liquidity contexts. `ux-provenance.json` records their purpose, generation briefs and SHA-256 hashes. Numeric outcomes are always rendered from runtime data, never baked into artwork.

`cute-fly-v1.png` is the shared chibi mascot generated with image_gen on 2026-09-26. The realistic `bioagent.png` is retained only as historical source material and is not displayed. The mascot stays upright with a slight directional lean; learning keeps it still.
