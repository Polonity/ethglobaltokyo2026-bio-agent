# BioAgent — 提出・説明資料 / Submission materials

**何をしたいか：生物由来の判断モデルをアプリで使い、学習効果と計算資源を比較できるフレームワークをつくる。** まずオンチェーン入力の箱庭で、入力・判断・学習のつながりを確かめます。生物回路の性能優位は未確認です。

**Purpose: build a framework to use biologically derived decision models in applications and compare learning effects and resource use.** The onchain-input playground makes the input–decision–learning path inspectable. Biological superiority remains unproven.

## まず開く資料 / Start here

| 用途 / Use | 日本語 | English |
| --- | --- | --- |
| 約1分6枚＋構成付録 / Six slides + architecture | [PDF](presenter-kit/explanation-ja.pdf) · [PPTX](presenter-kit/explanation-ja.pptx) | [PDF](presenter-kit/explanation-en.pdf) · [PPTX](presenter-kit/explanation-en.pptx) |
| 段階別の原稿・操作 / Script & walkthrough | [日本語](presenter-kit/walkthrough-ja.md) | [English](presenter-kit/walkthrough-en.md) |
| 手元のQ&A・4ページ / Four-page Q&A | [PDF](presenter-kit/qa-cheatsheet-ja.pdf) | [PDF](presenter-kit/qa-cheatsheet-en.pdf) |
| 提出動画・57.1秒 / Submitted video | [MP4](presenter-kit/bioagent-submission-ja.mp4) | [MP4](presenter-kit/bioagent-submission-en.mp4) |

[資料一式と検証記録 / Presenter kit](presenter-kit/README.md) · [目的と設計意図 / Rationale](bioagent-thesis.md)

## 説明する順番 / Explanation sequence

1. **目的 / Purpose:** 小さい判断モデルが適応に役立つ条件を検証する。
2. **入力 / Inputs:** 初期環境・危険エリアをTXに記録し、正の刺激TXで餌を追加する。
3. **判断 / Decisions:** 記録済み環境と内部状態を感覚へ変換し、回路から行動を選ぶ。
4. **学習 / Learning:** 経験と確認済み環境を再生し、候補と旧方策を比較する。
5. **検証 / Evidence:** 実装が動く証拠と、別の対照実験による効果を分けて示す。
6. **次の課題 / Next:** 同じ仕事で小型AIと比較し、適応・失敗率・計算資源を測る。

## 公開デモと動画の範囲 / Demo boundaries

[公開デモ：日本語](https://ethglobaltokyo-bio-agent-sepolia.commun-official.workers.dev/?lang=ja) · [English](https://ethglobaltokyo-bio-agent-sepolia.commun-official.workers.dev/?lang=en)

| 対象 / Track | 実装と証拠 / Implementation and evidence |
| --- | --- |
| 現在の共通Fly Lab | Sepolia・7神経／19接続・3個体。Anvilと同じUI・Q学習。初期環境・危険エリア・刺激・餌の外部入力をすべてTXで記録。身体・消費・判断・学習はオフチェーン。[実TXと画面確認](judge-demo-review.md) |
| 全神経の提出動画 | Anvil・166,700神経／個体。前半は2個体の環境TXと学習比較、後半は4個体の市場。新規Aqua 2件・V3 25件の成功決済とreadout更新を記録。[収録証拠](presenter-kit/capture-evidence.json) |
| 独立した研究 | 合成採餌環境で学習・評価・対照比較。報酬改善は観測したが、直接入力モデルへの優位は未確認。[結果](../research/bioagent-adaptation/README.md) |

The public page is a foraging demo; it does not send Aqua/Uniswap orders. The newly recorded video shows current environment TXs and readout comparison with two full-foraging agents, then four full-market agents settling on Aqua/V3. Full-foraging selection, market online updates and the independent research framework are distinct from public Q-learning. Long waits are omitted; each shown segment remains at its original speed.

公開版はウォレットなしで観察・学習できます。手動TXは所有者のみ。Workersは所有者EOAで毎時確認・最低1時間間隔の刺激送信を行います。1分の発表は記録済みTXを使い、次の定期TXを待つ構成にはしません。[操作・予算・配置](../deployment/sepolia.md)

## 詳しい資料 / Supporting material

- [AI Agent比較：期待・実測・次の測定](presenter-kit/ai-agent-comparison.md)
- [全神経の共有市場](../apps/shared-market/README.md)
- [独立JSフレームワーク](../../packages/bioagent-framework/README.md)
- [実行境界・実装言語・データの流れ](../architecture.md) · [English](../architecture.en.md)
- [1inch Aquaの個別提出資料](1inch-aqua.md)：公式Aqua forkと既存証拠。最新の4個体動画は上記を使用。
- [以前の全神経アプリ受入記録](full-apps-acceptance.md)：別ランタイムの保存済み検証。

外部フォームへの提出は未実施です。スポンサー要件と提出項目は提出時に公式ページで確認してください。これは研究用プロトタイプと仕様案で、承認済み標準や本番運用の性能保証ではありません。
