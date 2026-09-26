# 共通Fly Lab — 審査員向け動作確認

2026-09-26。[日本語](https://ethglobaltokyo-bio-agent-sepolia.commun-official.workers.dev/?lang=ja) / [English](https://ethglobaltokyo-bio-agent-sepolia.commun-official.workers.dev/?lang=en)。

**初期環境、危険エリア、刺激、餌の追加がTXに結び付いたデモです。** AnvilとSepoliaは同じ画面と判断・学習処理を使います。生物由来モデルの性能優位を実証したという意味ではありません。

## 確認できたこと

| 項目 | 実行結果 |
| --- | --- |
| Anvilの環境更新 | 保留中は危険エリアが変化せず、確定後だけ新しい位置・半径へ切り替わった |
| 餌の追加 | 保留中は増えず、正の刺激TX確定後に1個追加。重複受信では増えない |
| 消費 | 食べた餌を削除し、自動補充しない。消費履歴を保存する |
| 初期環境なし | 合成値で代替せず停止する |
| 学習 | 確認済み環境のコピーを使い、表示中の環境を変更しない |
| 全神経版 | 166,700神経・7神経それぞれ4stepの実計算で、環境TX由来の危険エリアと2件の刺激TXを確認 |
| 公開ページ | 日英・390pxモバイル表示、JavaScript例外なし。HTML・CSS・JSが共通ビルドとbyte単位で一致 |
| Cloudflare定期TX | 下記の実TXが成功し、開いたままの画面で餌と履歴が3→4へ増えた |
| 再試行 | 同じ時間帯の再実行では同じhashを確認。中断・再起動・同時起動も専用Anvilで検証 |

## 公開チェーンの証拠

- [初期環境TX](https://sepolia.etherscan.io/tx/0xbe67b3bb2e1e2ed1a84a1582a8cfa4f7ccd9afa522e0a6f916a93c8a7a6542dc)
- [Cloudflare定期送信TX](https://sepolia.etherscan.io/tx/0x48fdd866927b1fa4b4202c877f88e8e630def1f89d944ecfb6f849700c9a77bd)：block **11785418**、gas **34,209**、手数料 **0.000034342273782621 Sepolia ETH**。
- 署名者：`0x0d01a92bae0E01754f7102466936397F609D67C3`。確認後残高 **0.016363387080355746 ETH**。
- 毎時Cronと最低1時間の送信間隔。設定上の24時間最大額 **0.00432 ETH**。24時間の連続試験は未実施。

## 実装の範囲

外部の環境入力はすべてオンチェーン。位置・身体・学習状態は、その入力からランタイムが計算する内部状態です。餌の位置はTX hashと記録済みseedから決まります。消費や学習結果をチェーンへ書き込む構成ではなく、ブラウザー間で身体状態を同期するデモではありません。

公開デモは7神経の部分回路、提出動画は既存のAnvil＋全神経版。以前の専用Sepolia画面で得た学習比較の数値を、現在の共通UIの測定値として流用しません。[研究比較](../research/bioagent-adaptation/README.md)は独立した実験として扱います。

## 再現と記録

```sh
npm run local:up      # 別ターミナルで起動
npm run test:local    # 環境TX・刺激TX・reorgの実ブラウザ試験
npm run test:sepolia  # 送信journalと共通入力のテスト
npm run test:sepolia:public
```

[検証要約JSON](sepolia-evidence.json)。生の試験出力は`artifacts/local-chain/verification.json`、`artifacts/sepolia/shared-ui-public/`、`artifacts/sepolia/cron-verification.json`、`artifacts/sepolia/full-runtime-environment.json`。削除した旧専用監査スクリプトには依存しません。

## English

The live demo now shows a verifiable input path: an initial environment TX defines hazards and field settings; confirmed positive stimulus TXs add food. Pending or duplicated TXs do not add food, and consumed food does not respawn. Local Anvil and public Sepolia serve identical UI assets and use the same decision and learning code.

A real Cloudflare-scheduled Sepolia TX increased visible food from **3 to 4** without reloading. It consumed **34,209 gas**. Full-neuron and reduced Anvil runtime checks also consumed recorded environment inputs. These checks demonstrate integration and input provenance, not biological superiority, trading performance or 24-hour uptime.
