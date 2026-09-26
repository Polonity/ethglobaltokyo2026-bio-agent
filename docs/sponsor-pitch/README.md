# One-minute sponsor pitches

The user's latest direction is concise material that conveys the message in about one minute. These are the primary deliverables, superseding the 14-slide decks for presentation use.

Each of Uniswap and 1inch Aqua has Japanese and English editions with three slides:

Uniswap: our actual V3 builder context → adaptation to concentrated-liquidity changes → reusable integration examples and comparison evidence (about 20 seconds each). The first proposed user is a rebalancing-agent developer. The current fixture has one wide liquidity range; active-liquidity inputs, multi-range scenarios and Router integration are proposed. Economic benefit and biological advantage remain unproven. Existing CPU measurement is supporting evidence, not the main pitch. See `uniswap-router-value-brief-ja-en.md` for stakeholder context and the test plan, and `uniswap-form-draft-ja-en.md` for form-ready text.

1inch: what works today (15 seconds) → next proposal (20 seconds) → alignment (25 seconds).

Speaker notes contain short narration in the selected language. Uniswap notes also include separate Q&A context; script files contain only the speaking text. Timing is a speaking guide, not a measured recording. Current implementation and future proposals remain distinct. Detailed source explanations are kept in the earlier 14-slide materials.

```sh
node docs/sponsor-pitch/build.mjs uniswap
node docs/sponsor-pitch/build.mjs aqua
node docs/sponsor-pitch/validate.mjs
/mnt/c/Users/hiken/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe "$(wslpath -w "$PWD/docs/sponsor-pitch/audit.py")"
```

Outputs: `artifacts/sponsor-pitches-1min-20260926/`. PptxGenJS and Python document libraries are loaded from the bundled Codex runtime. PDF appearance and PPTX structure/notes are checked; native PowerPoint rendering is not checked.
