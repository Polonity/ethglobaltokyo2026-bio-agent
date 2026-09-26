"""Assemble the two bilingual sponsor packs without changing previous originals."""
import hashlib
import json
import shutil
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'artifacts' / 'sponsor-proposals-20260926'
OUT.mkdir(parents=True, exist_ok=True)
packs = {
    'uniswap': ROOT / 'artifacts' / 'uniswap-proposal-20260926',
    '1inch': ROOT / 'artifacts' / '1inch-aqua-meeting-20260926',
}
copied = {}
for name, source in packs.items():
    validation = json.loads((source / 'validation.json').read_text())
    assert validation['passed'], name
    files = []
    for p in sorted(source.rglob('*')):
        rel = p.relative_to(source)
        if not p.is_file() or 'previews' in rel.parts or p.suffix == '.zip' or p.name in ('scene-manifest.json', 'SHA256SUMS.txt'):
            continue
        dest = OUT / name / rel
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(p, dest)
        assert hashlib.sha256(p.read_bytes()).digest() == hashlib.sha256(dest.read_bytes()).digest()
        files.append(rel.as_posix())
    copied[name] = {'files': len(files), 'identicalToOriginal': True, 'originalDirectory': str(source)}

html = '''<!doctype html><html lang="ja"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>BioAgent / Uniswap & 1inch 提案資料</title><style>
*{box-sizing:border-box}body{margin:0;background:#f6f5f2;color:#203041;font:16px/1.7 'Yu Gothic','Noto Sans CJK JP',sans-serif}main{max-width:1120px;margin:45px auto;padding:24px}h1{font-size:40px;line-height:1.3}small{color:#637284;letter-spacing:.12em}.grid{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin:28px 0}.card{background:white;padding:25px;border-top:5px solid var(--accent)}h2{margin:0 0 12px;color:var(--accent)}h3{font-size:18px;margin:20px 0 8px}a{color:var(--accent,#245eb2)}.links{display:flex;flex-wrap:wrap;gap:8px 18px}.primary{display:inline-block;background:var(--accent);color:white;padding:10px 16px;text-decoration:none;border-radius:5px;font-weight:bold}.minor{font-size:13px;color:#637284}hr{border:0;border-top:1px solid #e2e5e8;margin:22px 0}@media(max-width:750px){.grid{grid-template-columns:1fr}h1{font-size:30px}}@media print{main{margin:0}a{color:#203041}.primary{color:white}}
</style><main><small>BIOAGENT / SPONSOR PROPOSALS / 2026.09.26</small><h1>Uniswap・1inchへの提案資料<br>日本語 / English</h1><p>各スポンサー14枚 × 日英2言語。PowerPointには全ページの発表者ノートを収録。要約・合意事項シート・想定問答・保存済み英語動画も入っています。</p><div class="grid">
<article class="card" style="--accent:#a32f76"><h2>Uniswap Foundation</h2><p>V3の実行結果を使い、Agentの判断・学習・比較を追える評価ツールを提案。</p><h3>日本語</h3><a class="primary" href="uniswap/Uniswap-proposal-ja.pdf">日本語PDFを開く</a><p class="links"><a href="uniswap/Uniswap-proposal-ja.pptx">PowerPoint</a><a href="uniswap/Uniswap-proposal-ja.html">ブラウザー版</a><a href="uniswap/Meeting-brief-ja.pdf">1枚要約</a><a href="uniswap/Decision-sheet-ja.pdf">合意事項シート</a></p><h3>English</h3><a class="primary" href="uniswap/Uniswap-proposal-en.pdf">Open English PDF</a><p class="links"><a href="uniswap/Uniswap-proposal-en.pptx">PowerPoint</a><a href="uniswap/Uniswap-proposal-en.html">Browser slides</a><a href="uniswap/Meeting-brief-en.pdf">Brief</a><a href="uniswap/Decision-sheet-en.pdf">Worksheet</a></p><hr><p><a href="uniswap/proposal-qa-bilingual.md">12問の日英想定問答 / Q&A</a></p><p><a href="uniswap/index.html">Uniswap資料一覧・動画 / All files & video</a></p></article>
<article class="card" style="--accent:#2665c7"><h2>1inch / Aqua</h2><p>現在のAqua利用を確認し、SwapVMの採用と共有在庫に応じた次のデモを相談。</p><h3>日本語</h3><a class="primary" href="1inch/Aqua-meeting-ja.pdf">日本語PDFを開く</a><p class="links"><a href="1inch/Aqua-meeting-ja.pptx">PowerPoint</a><a href="1inch/Aqua-meeting-ja.html">ブラウザー版</a><a href="1inch/Meeting-brief-ja.pdf">1枚要約</a><a href="1inch/Decision-sheet-ja.pdf">合意事項シート</a></p><h3>English</h3><a class="primary" href="1inch/Aqua-meeting-en.pdf">Open English PDF</a><p class="links"><a href="1inch/Aqua-meeting-en.pptx">PowerPoint</a><a href="1inch/Aqua-meeting-en.html">Browser slides</a><a href="1inch/Meeting-brief-en.pdf">Brief</a><a href="1inch/Decision-sheet-en.pdf">Worksheet</a></p><hr><p><a href="1inch/meeting-qa-bilingual.md">12問の日英想定問答 / Q&A</a></p><p><a href="1inch/index.html">1inch資料一覧・動画 / All files & video</a></p></article>
</div><p>Uniswap版は今回作成。1inch版は前回作成した日本語・英語の資料を再収録しています。実装済みの内容、公式要件、今後の提案は区別しています。</p><p class="minor">PDF表示を確認済み。PowerPointは構造・編集可能テキスト・ノートを検査し、Microsoft PowerPoint本体での描画は未確認です。チームの希望や合意は未確認。フォーム送信・対外連絡は行っていません。</p><p class="minor"><a href="README.md">使い方 / Read me</a> · <a href="bundle-validation.json">検査記録 / Validation</a> · <a href="https://ethglobal.com/events/tokyo2026/prizes/uniswap-foundation">Uniswap official requirements</a> · <a href="https://ethglobal.com/events/tokyo2026/prizes/1inch">1inch official requirements</a></p></main></html>'''
(OUT / 'index.html').write_text(html, encoding='utf-8')
readme = '''# BioAgent / Sponsor proposal pack

2026-09-26 · 日本語 / English

## まず開く / Start here

`index.html` に両スポンサーの日英資料をまとめています。ZIPを展開してから開いてください。
Open `index.html` after extracting the ZIP. It links to both sponsors in Japanese and English.

| Sponsor | Japanese | English |
| --- | --- | --- |
| Uniswap | uniswap/Uniswap-proposal-ja.pdf | uniswap/Uniswap-proposal-en.pdf |
| 1inch Aqua | 1inch/Aqua-meeting-ja.pdf | 1inch/Aqua-meeting-en.pdf |

同名の `.pptx` は編集可能なPowerPointです。各14枚、全ページに発表者ノートがあります。`.html` では矢印キーで移動、Nキーでノートを表示できます。
Matching `.pptx` files are editable PowerPoint decks with notes on all 14 slides. In HTML, use arrow keys to navigate and N to show notes.

各フォルダーには日英の `Meeting-brief-*.pdf`（1枚要約）、`Decision-sheet-*.pdf`（合意事項シート）、12問の日英想定問答、説明原稿、保存済み英語デモ動画、出典・検査記録を収録しています。
Each folder includes bilingual one-page briefs, decision worksheets, 12 Q&A items, speaker notes, an existing English demo video, sources and validation.

## 各提案の中心 / Proposal focus

- Uniswap: 実V3の市場履歴・quoteを使い、学習Agentの判断を再現・比較する評価環境。現在のAgent注文はペーパートレードです。
- 1inch: Aqua上の流動性提示・撤回・実テスト決済と、次の共有在庫デモの相談。現在は独自AquaFlyAppで、SwapVMは未導入です。

- Uniswap: reproducible agent evaluation using actual V3 market history and quotes. Current agent orders are paper trades.
- 1inch: Aqua liquidity offers, withdrawal and actual test-token settlement; discuss a shared-inventory demo. The current app uses a custom AquaFlyApp and does not integrate SwapVM.

Uniswap版は今回作成。1inch版は前回の日本語・英語資料を内容を変えず再収録し、日本語PDFとPPTXの存在・内容を再確認しています。両スポンサーの希望や合意を推測して記入していません。
The Uniswap pack is new. The earlier bilingual 1inch pack is included unchanged, with its Japanese PDF and PPTX rechecked. Team preferences and agreement are not assumed.

今回の作業は資料作成です。新しい取引・学習・デプロイ・フォーム提出・チームへの連絡は実施していません。掲載結果は保存済み記録です。
This work prepares documents only. No new trades, training, deployment, form submissions or team outreach occurred. Results come from saved evidence.

PDFは描画確認済み。PPTXは構造とノートを検査済みですが、Microsoft PowerPoint本体での描画は未確認です。
PDFs were rendered and inspected. PPTX structure and notes were checked, but not native Microsoft PowerPoint rendering.

MaleCNS attribution is recorded in each pack. Powered by Aqua — © Degensoft Ltd 2025 applies to the Aqua materials.
'''
(OUT / 'README.md').write_text(readme, encoding='utf-8')
(OUT / 'bundle-validation.json').write_text(json.dumps({'prepared':'2026-09-26','copies':copied,'artifactChecks':'pending final bundle check'}, ensure_ascii=False, indent=2)+'\n')
print(json.dumps({'out':str(OUT),'copies':copied}, indent=2))
