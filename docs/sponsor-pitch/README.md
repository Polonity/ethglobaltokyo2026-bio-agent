# One-minute sponsor pitches

> **履歴資料 / Historical snapshot.** 現行実装の説明には[最新の日英スライド・実演手順・Q&A](../submission/presenter-kit/README.md)を使用してください。このディレクトリの旧スライドは作成時点の保存資料で、Sepolia配置前の記述や未実装の提案を含みます。Use the current presenter kit; these older proposals are not a current implementation guide.

The user's latest direction is concise material that conveys the message in about one minute. These were the sponsor-discussion materials at that stage. The current presenter kit above supersedes them for implementation explanations.

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
