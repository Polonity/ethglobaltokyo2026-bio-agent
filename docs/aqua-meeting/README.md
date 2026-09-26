# BioAgent × Aqua meeting materials

Purpose: review present Aqua usage with the 1inch team and agree on the next demo. The Japanese and English decks share 14 page numbers. Slides 1–12 support the meeting; 13–14 are technical notes and sources. Team preferences are deliberately left pending.

Outputs are in `artifacts/1inch-aqua-meeting-20260926/`:

- `index.html`: local viewing hub, with a recorded English demo video.
- `Aqua-meeting-{ja,en}.{html,pdf,pptx}`: matching decks, editable PPTX and speaker notes.
- `Meeting-brief-{ja,en}.pdf`: one-page preparation sheet.
- `Decision-sheet-{ja,en}.pdf`: one-page meeting worksheet.
- `speaker-notes-{ja,en}.md`, `meeting-qa-bilingual.md`: preparation notes and 12 anticipated questions.
- `decisions-bilingual.md`: editable record template with no assumed agreement.
- `sources.md`, `source-review.json`, `evidence-snapshot.json`, `validation.json`: provenance and evidence boundaries.

Source review covers the current two-individual full-population app, the custom AquaFlyApp, official Aqua source, official ETHGlobal requirements and Aqua documentation. No application changes, new transactions, training, deployments, or external messages are part of this work. Recorded evaluation values are reused; fresh application performance is not claimed.

## Rebuild

The build uses the bundled PptxGenJS runtime, local Playwright and Google Chrome. PDF validation uses the bundled Windows Python (Pillow, pypdf, PDFium and python-pptx).

```sh
node docs/aqua-meeting/build.mjs
node docs/aqua-meeting/handouts.mjs
node docs/aqua-meeting/validate.mjs
/mnt/c/Users/hiken/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe "$(wslpath -w "$PWD/docs/aqua-meeting/audit_artifacts.py")"
```

The builder expects the existing frozen acceptance JSON and GUI image in the output folder and the saved English Aqua video under `artifacts/full-app-demos-20260926/`. It does not produce new runtime evidence. Review `source-review.json` before reusing the slides against changed application code.

PDFs are rendered and visually inspected. PPTX packages, editable text and all speaker notes are parsed and checked; Microsoft PowerPoint rendering is not checked. The PDF is the verified presentation view.

Powered by Aqua — © Degensoft Ltd 2025. MaleCNS data attribution is retained in `sources.md` and the viewing hub.
