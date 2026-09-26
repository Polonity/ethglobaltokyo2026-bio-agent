# Uniswap proposal and bilingual sponsor bundle

This task produces a 14-slide Japanese and English proposal for a V3-based BioAgent evaluation workflow. It also collects the existing 1inch Aqua Japanese and English meeting packs in a single viewing hub.

## Outputs

- `artifacts/uniswap-proposal-20260926/`: new Uniswap proposal, editable PPTX, verified PDF, HTML, speaker notes, one-page briefs, worksheets and 12 bilingual Q&A items.
- `artifacts/sponsor-proposals-20260926/`: combined distribution. `index.html` presents Japanese and English side by side for both sponsors.
- The original `artifacts/1inch-aqua-meeting-20260926/` remains unchanged.

Facts come from current source review, the official ETHGlobal prize and feedback pages, and stored September 26 acceptance evidence. The actual V3 market-generation swaps and the agent's paper orders are distinguished. The proposal does not claim profitability, full-model superiority, completed submission or team agreement.

## Rebuild

```sh
node docs/uniswap-proposal/build.mjs
node docs/uniswap-proposal/handouts.mjs
node docs/uniswap-proposal/validate.mjs
/mnt/c/Users/hiken/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe "$(wslpath -w "$PWD/docs/uniswap-proposal/audit_artifacts.py")"
python3 docs/uniswap-proposal/package.py
```

The build uses bundled PptxGenJS, local Playwright and Google Chrome, and bundled Windows Python with PDFium, pypdf, Pillow and python-pptx. Frozen JSON and image inputs must exist in the output folder. Video is existing recorded evidence, not a new experiment.

PDFs are rendered and visually inspected. PPTX structure, editable text and notes are checked; native PowerPoint rendering is not checked. No app code, live market state, feedback submission, licensing choice or external communication is changed by these document scripts.
