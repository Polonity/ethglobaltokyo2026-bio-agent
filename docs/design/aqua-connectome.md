# Aqua Connectome — 刺激で変わる共有流動性

2026-09-26。Powered by Aqua — © Degensoft Ltd 2025.

**ハエに危険の刺激を送ったら、流動性の提示はどう変わる？**

BioAgentの第3の箱庭。実測の接続構造に人工的な刺激を与え、その応答をAqua戦略に変換する。公式Aqua本体をAnvilに配置し、3個体が1つのウォレットから仮想残高を提示する。UIは `/aqua`。既存の採餌・市場・Circuit Labを維持する。

## 草案から採用したこと・修正したこと

| 草案 | 調査後の方針 |
| --- | --- |
| 共有流動性と神経回路を接続 | 採用。刺激→実測接続に基づく計算→SDK→実Aquaトランザクションを実装 |
| 資本効率と脳構造の同型性を実証 | 数学的な対応や保存量を定義していないため主張しない。「生物由来の制御器を共有流動性に接続する」という工学的仮説にする |
| 全脳、キノコ体・側角・CXの再現 | 今回はMaleCNSの既存7神経・19接続。これらの脳部位の再現とは呼ばない |
| ガスレスな署名無効化で即時撤回 | `ship/dock` はオンチェーン書込み。撤回は採掘後に成立。未採掘の撤回による保護は保証しない |
| StrategyHashを動的変形 | 戦略パラメータは不変。旧戦略をdockし、新しいrevisionを含むstrategyをship |
| 同じ資金を複数チェーンで共有 | 今回は同一チェーン内。チェーンをまたぐ残高移動・橋渡しは別の機構が必要 |
| Mempoolから安全なフローのみ選別 | 未実装。手動の人工危険刺激。MEV検出・LVR低減は検証していない |
| DAN報酬学習、CXルーティング | 次の独立した研究段階。今回は固定回路。報酬学習や市場トレンド検出を装わない |

[公式Overview](https://business.1inch.com/portal/documentation/aqua/overview)、[SDKソース](https://github.com/1inch/sdks/tree/master/typescript/aqua)、[Aqua実装](https://github.com/1inch/aqua/blob/ef24220ed9647555727b06867bf509cd6959d84b/src/Aqua.sol)を確認。Aquaは戦略ごとの仮想残高を管理し、価格ロジックはAquaAppが実装する。今回の `AquaFlyApp` は独自のローカルアプリであり、本番SwapVM、1inchの公開取引画面やPathfinderへの接続ではない。

## 実装経路

1. GUIが個体の危険刺激をRegistryの `BioAgentStatus` に記録。`IBioAgent` の仕様は変更しない。
2. Workerが同一ブロックのStatusと `BioAgentStatusUpdated` イベントを照合。出典TX・blockHash・logIndexを応答に含める。
3. 回路をゼロ状態から32tick実行。応答を人工的なrisk decoderで流動性提示へ変換。
4. Workerが `@1inch/aqua-sdk@0.3.4` でship/dock calldataを生成し、ローカルunlocked makerから送る。GUIが確認済みreceiptを表示。
5. 別のローカルtakerから1 NECTARを交換できる。Aquaのpush/pullによる実ERC20移動を確認する。テストトークンに経済価値はない。

実行ロジックはWorker。ブラウザーは同じ計算を独立に再実行し、結果を照合・可視化する。操作ごとの実行であり、常駐自律取引botではない。

## 型と人工的な仮定

- 登録先: 3個体の `BioAgentRegistry`。全個体が同じmakerとcontroller descriptorを参照。
- 刺激: `uint16 stimulus`、0〜10000。市場の実測値ではない。activityとenergyは今回使わない。
- 感度: MOMO 0.7、SORA 1.0、KIKI 1.3。`drive = min(1, stimulus / 10000 * sensitivity)`。
- 神経計算: 既存の[人工rate model](circuit-evidence.md)。同じ刺激で全接続を除去した対照も計算し、画面に表示。
- 出力: response < 0.045なら100 tokenずつを提示、0.045以上0.1未満は40 tokenずつ、0.1以上は撤回。提示時のspreadは `round(30 + response * 4000)` bps。
- strategy bytes: `abi.encode(uint256 agentId, uint256 revision, uint256 spreadBps, bytes32 modelHash)`。`strategyHash = keccak256(bytes)`。maker/app/tokenペアはコントラクトとAquaのmappingで束縛。
- 交換: NECTAR/POLLENとも18桁、人工の1:1基準価格。`amountOut = amountIn * (10000 - spreadBps) / 10000`。市場価格やoracleは使わない。
- descriptor: `bioagent.aqua-controller.v1`。controller・graph・dynamicsのSHA-256と仮定を記録し、descriptorのSHA-256をRegistryに登録。現段階ではAquaアプリ専用の形式であり、汎用profileの最終仕様ではない。

3戦略×100 tokenの仮想提示に対し、makerは初期100 tokenずつしか持たない。これは資産が増えたことを意味しない。ある戦略の約定は実ウォレット残高を変え、別戦略の約定可能量にも影響する。提示と撤回では資金は移動せず、約定時だけ移動する。

## 実行境界

- localhost、Anvil chain 31337、deployment block hashの一致を必須とする。任意RPCや任意calldataをGUIから送れない。
- 同一OriginのJSON POST、固定の3個体、expected revisionと入力範囲を検査。
- makerが手動で任意の戦略をshipする能力は残る。回路に従った戦略だけを許すオンチェーン証明ではない。
- `AquaFlyApp` は登録owner・modelHash・現在の刺激revisionを確認。新刺激の採掘後は、dock前でも古いrevisionの戦略は約定できない。
- dock→shipは2つのトランザクションで非原子的。失敗時は実チェーン状態を再読込し、再試行する。現在の戦略があればapplyを重複送信しない。途中で新刺激が入っても古いrevisionの戦略は交換時に拒否する。
- smart wallet、学習権限、セッションキー、本番運用監視は未実装。既存のwallet referenceを実スマートアカウント実装と混同しない。

## 起動・再現

Node依存はルートのlockfile、SolidityはFoundryで固定ソースからビルドする。

```bash
npm ci
# 別ターミナルで起動し維持。既存環境を使う場合は起動し直さない。
ANVIL_PORT=18546 LOCAL_GUI_PORT=8799 LOCAL_INSPECTOR_PORT=9249 \
  LOCAL_STATE_DIR=.local/embodied npm run local:up
# 起動済み環境に追加。再実行すると新しい独立デプロイになる。
LOCAL_STATE_DIR=.local/embodied npm run local:aqua
npm run test:aqua
forge test --root contracts
LOCAL_GUI_URL=http://127.0.0.1:8799 npm run test:aqua:browser
```

FoundryがPATHにない場合は `FORGE=/path/to/forge ANVIL=/path/to/anvil` を設定する。設定ファイルを更新するとローカルWranglerが再読込する。モデルソースを変更した場合はbuildだけで済ませず、新descriptorを登録するため `local:aqua` を再実行する。

GUI: http://127.0.0.1:8799/aqua 。APIは `/api/aqua/snapshot`、`stimulus`、`apply`、`fill`、`receipt?hash=…`。書込みbodyは `{agentId: number, revision: string}`、stimulusのみ `stimulus: number` を追加。

## デモ台本

“Three flies share one wallet. Give one a risk signal. Its measured neural connections drive an engineered response. The response changes a real Aqua strategy. Watch the virtual offer shrink, then disappear—and inspect the actual transaction.”

3匹に0%刺激を送り、100ずつの共通残高に3つの提示ができることを見せる。1 tokenの交換で残高変化を確認。SORAに40%刺激で小さな提示、100%で撤回。光る回路、吹き出し、response、strategyHash、receiptを順に示す。最後に、実測接続と人工的な計算・刺激の境界を明示する。

## ライセンスとプロダクト化の次段階

公式ソースの固定commitと同梱ライセンスは[依存記録](../../contracts/vendor/README.md)参照。AquaのライセンスはMITではない。今回の統合はローカル実験としてソースと帰属表示を添える。本番商品化では同梱ライセンスの商用条件を確認し、経済的リスク制限・権限・監査・運用方式を別途設計する。

将来は実市場の観測→人工感覚mapping、学習の対照評価、独立したリスク上限へ進める。キノコ体・DAN・CXを使うなら、対応する実測回路の抽出と機能の根拠を先に整える。クロスチェーンやRobinhood Chainの対応・資産利用可能性は、このローカル試作では主張しない。

## 検証記録 — 2026-09-26

- Foundry: 既存を含む29テスト成功。Aqua追加6件で共有残高、原子的交換、dock後の交換拒否、刺激更新後の旧戦略拒否、資金不足時の全ロールバック、再ship不可、slippage/identityを確認。
- Node: Aquaの3テスト成功。回路応答と接続除去対照、入力拒否、公式SDKと実Aqua ABIの一致。
- Chrome + ローカルWorkers/Anvil: 3個体の提示、1 tokenの実交換、40%刺激で40 tokenの提示、100%刺激でdock、receipt、Origin拒否、古いrevision拒否、重複apply防止、改変artifact拒否、英日・390px表示を確認。
- 既存Circuit Labと市場GUIのブラウザー回帰チェック成功。共通型3テスト、JS/CSS/HTML整形、Foundry整形も成功。
- 証跡: `artifacts/aqua-browser/evidence.json`、`shared-wallet.png`、`cautious.png`、`danger.png`、`mobile.png`。画像は実画面の記録。現在の統合デモ動画にはまだAquaを収録していない。

確認はローカルの機能接続に限る。未見市場での性能、長期損益、生物学的機能、本番セキュリティの実証ではない。
