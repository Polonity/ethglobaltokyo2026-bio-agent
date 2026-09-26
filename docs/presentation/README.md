# BioAgent explanation slides

> **Historical snapshot.** Use the [current presenter kit](../submission/presenter-kit/README.md) for implementation explanations. These older slides include pre-Sepolia statements and unimplemented proposals.

Prepared from saved2026-09-26 acceptance records and source for study/Q&A. Japanese and English editions share slide numbers/structure. Performance figures are reused evidence, not new measurements.

Output: `artifacts/explanation-slides-20260926/`.

- index.html: bilingual entry point.
- BioAgent-ja/en.pptx: editable PowerPoint with speaker notes.
- BioAgent-ja/en.pdf: reading/printing.
- BioAgent-ja/en.html: offline slides; arrows navigate, N toggles notes.
- study-notes-ja/en.md: per-slide scripts; qa-bilingual.md: Q&A.
- source-audit.json: provenance/hash checks.
- validation.json: rendering, clipping, and PPTX structure checks.

Source/build scripts live here. Building creates local artifacts; it does not run learning or modify deployments.

```sh
node docs/presentation/build.mjs
node docs/presentation/validate.mjs
```

Uses PptxGenJS and Playwright/Chrome; bundled dependency paths are configured in source. `audit_artifacts.py` uses bundled Windows Python for independent PDF rendering and PPTX page/notes/XML checks, not native PowerPoint rendering.

Reproduction requires the saved evidence-snapshot.json and assets/ under the output directory. Preserve the full bundle to pin screenshots and numerical evidence.
