# Sepolia / 共通Fly Lab

[日本語デモ](https://ethglobaltokyo-bio-agent-sepolia.commun-official.workers.dev/?lang=ja) · [English demo](https://ethglobaltokyo-bio-agent-sepolia.commun-official.workers.dev/?lang=en)

**ハエに与える外部入力はすべてオンチェーンデータです。** 初期環境・危険エリア・餌・活動・刺激・供給条件を、確定したTXから受け取ります。感覚入力への変換、身体状態、判断、学習はオフチェーンで計算します。

## 1分で確認する

1. ウォレットなしでページを開き、3匹を観察する。
2. 「環境と餌の入力TX」で、危険エリアの初期TXと餌の追加元TXを確認する。
3. 正の刺激TXが1件確定すると黄色い餌が1個増える。食べると消え、自動補充しない。
4. 「学習室へ」で確認済み環境を再生して学習する。学習用コピーは表示中の餌を増やさない。

新しいブラウザーは、現在の環境TX以降の刺激履歴を再生します。消費済みの餌はブラウザーに記録し、再読込で復活しません。身体・消費・学習状態は別ブラウザーと共有せず、オンチェーンの入力を共有します。

## 入力と共通実装

| 入力 | TXと処理 |
| --- | --- |
| 初期環境・危険エリア | Agent #1の`submitStimulus`。`bioagent.foraging-world.v1`スキーマで幅・高さ・seed・餌配置範囲・危険エリアの位置と半径を記録 |
| 環境の変更 | 同スキーマの新TXでフィールドを再構築し、以前の餌を消去 |
| 活動・刺激・供給 | 個体ごとの`updateStatus`。正の刺激の成功イベント1件で餌を1個追加。登録・刺激0・重複・revertでは追加しない |
| 餌の座標 | TX hashと環境TXのseed・寸法から決定的に計算 |

環境TX未確認、モデル不一致、古いSepoliaブロック、RPC断では停止し、ローカル環境へ切り替えません。receiptとcanonical blockを照合し、追加確認深度は0です。最終確定や神経計算の暗号学的証明ではありません。

- **共通画面**：`apps/frontend/`。AnvilとSepoliaで同じHTML・CSS・JSを配信。
- **共通行動・学習**：`packages/bio_agent/browser/arena.js`。
- **共通環境入力**：`tx-world.js` / `tx-food.js`。全神経Anvil版も共有。
- **共通イベント検証**：`services/worker/registry-read.js`。
- **環境差分**：RPC・chain ID・Registry・確認間隔・署名方法。Anvilはローカルアカウント、Sepoliaの手動送信は所有者ウォレット。

旧Sepolia専用UI・旧RPC中継・旧専用監査コードは削除しました。初期設定の送信元は[foraging-world.json](../../packages/bio_agent/browser/foraging-world.json)ですが、接続中のランタイムはTXに記録された値を読みます。オフライン研究用の合成環境は公開デモに混ぜません。

## 定期TXとガス代

Cloudflare Cron → `StimulusScheduler` Durable Object → Registry。毎時1回、Agent #1へ正の刺激を送ります。ブラウザーを閉じても実行され、外部HTTPから送信を起動するAPIはありません。

署名者は既存の試験用EOA **0x0d01a92bae0E01754f7102466936397F609D67C3**。ユーザーの許可で同じ試験資金を再利用します。鍵はCloudflare Secretで保管し、静的ファイル・ブラウザーへ渡しません。現在スマートウォレットではありません。

- 最低送信間隔1時間。再試行と同時起動は、永続保存した同じ署名TXを使う。
- 60,000 gas / 3 gweiを上限とし、24件の最大額は **0.00432 Sepolia ETH**。
- 直近24時間予算0.005 ETH、残す残高0.001 ETH。超過時は送信を見送る。
- [送信状態API](https://ethglobaltokyo-bio-agent-sepolia.commun-official.workers.dev/api/stimulus-scheduler)で直近のhashと状態を確認できる。

確認時の残高は約0.01636 ETH。これは上限による資金保護で、24時間連続稼働試験を完了した意味ではありません。[実TXと画面反映の記録](../submission/judge-demo-review.md)。

## 配置と再現

Ethereum Sepolia / **11155111** / Agent IDs **1, 2, 3**。

- Registry：[`0x09DF8a4feEaceB690Da135d8355B84A6691c323B`](https://sepolia.etherscan.io/address/0x09DF8a4feEaceB690Da135d8355B84A6691c323B)
- [初期環境TX](https://sepolia.etherscan.io/tx/0xbe67b3bb2e1e2ed1a84a1582a8cfa4f7ccd9afa522e0a6f916a93c8a7a6542dc) / [配置記録](../../contracts/deployments/sepolia.json)
- 既存の`BioAgentStimulusRegistry`を利用。配置bytecode一致を確認。旧Registryは配置記録の`previousRegistry`に残す。

```sh
npm ci
npm run sepolia:build
npm run sepolia:dev           # localhost:8836、実Sepoliaを読む
npm run test:sepolia          # 専用Anvilで環境入力・再送を検証
npm run test:sepolia:browser  # 起動済みlocalhost:8836を読む
npm run test:sepolia:public   # 公開ページを読む。送信なし
npm run sepolia:prepare      # 残高・ガス見積り
npm run sepolia:deploy       # 保存済みjournalで配置と初期入力を再開
npm run sepolia:publish      # このWorkerを更新
```

Node.js 22、Chrome、Foundryを使用。`.local/sepolia/`のkeystore・passphrase・署名journalはGit対象外です。journalを削除して予算や再送制御を回避しません。Cloudflare配布では`.env`のCloudflare認証情報だけを渡します。署名鍵は`wrangler secret put SEPOLIA_SIGNER_KEY --config wrangler.sepolia.jsonc`への標準入力で設定します。

## For judges / English

**All external inputs to the flies come from onchain data.** An initial `IBioAgentStimulus` transaction defines dimensions, hazards, seed and food placement bounds. Each confirmed positive status TX adds one food. Eating removes it without refill. Sensory encoding, body state, movement and learning run offchain; invalid or unavailable chain input pauses the simulation.

Anvil and Sepolia use the same UI and decision/learning runtime. Learning replays copies of the confirmed environment without adding visible food. The hourly Cloudflare sender uses the existing test wallet, a durable journal and gas/balance limits. Watching requires no wallet; manual writes require the owner.

The public model uses a measured **7-neuron / 19-edge subgraph**, not an equivalent compression of a full brain. It does not trade on Aqua or Uniswap. The submitted video remains the **Anvil / full 166,700-neuron** recording. That recording predates the current environment-TX changes; use this live page to demonstrate the current input behavior.
