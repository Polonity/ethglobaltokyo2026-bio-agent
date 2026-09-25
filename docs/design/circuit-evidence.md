# Circuit Lab — 実測接続が行動計算に使われることを検証する

2026-09-26。これは採餌・市場ゲームを置き換える第3の競争ではなく、BioAgentの中心的な主張を検査するための小さな検証画面です。既存2ゲームはsyntheticのままです。

## 起動と操作

AnvilとローカルWorkersを起動してから実行します。

```sh
npm run build
# local:upが起動済みの同じstate directoryを指定:
LOCAL_STATE_DIR=.local/embodied FORGE=/tmp/bio-agent-foundry-v1.8.3/forge npm run local:circuit
# http://127.0.0.1:8799/circuit
LOCAL_GUI_URL=http://127.0.0.1:8799 npm run test:circuit:browser
```

通常のPATH配置ならFORGE指定は不要。デフォルト構成はLOCAL_STATE_DIR=.local、GUI 8798です。local:circuitは新しい専用RegistryをAnvilへ配置し、同じdescriptorを持つ3個体を登録します。以前の回路セッションを再開する操作ではありません。既存の採餌・市場のRegistryには書き込みません。

MOMO等を選んで0%/100%刺激を送ります。確定したStatusイベントのstimulusだけを使って計算し、6出力ノードの平均活動からadvance/waitを決めます。TXリンクから実際のAnvil receiptを確認できます。採餌用の既存IBioAgent ABIを入力adapterとして再利用しており、activity/energyは無視すると明示しています。これを新しい普遍的BioAgent ABIとは呼びません。

## 実測と人工設計の境界

| 要素 | 現在の実装 |
| --- | --- |
| 出典 | MaleCNS v1.0、公式公開のannotationsとconnectome weights |
| 抽出 | bodyId 10001（DNp01）と、注釈のある出力先のうち接続数上位6神経 |
| 選択順 | weight降順、同点はbody_post昇順 |
| グラフ | 選択した7神経間の19接続。元IDと接続数を保持 |
| 動力学 | 人工的な離散rateモデル。全接続を正として扱い、最大接続数で正規化 |
| 入力 | stimulus/10000を神経10001へ直接加算。生物本来の感覚ではない |
| 時間 | ゼロ初期状態から32回の同期更新。tickに生物学的秒数は割り当てない |
| 出力 | 非入力6ノードの活動平均。0.1以上ならadvance、未満ならwait |
| 学習・身体 | この検証回路では実装しない。重み・構造・decoderは固定 |
| 表示 | 神経配置・ハエ移動・色は説明用。実測の位置や活動ではない |

更新式は `a_next = 0.75*a + 0.25*tanh(sum(count/maxCount*a_pre) + externalDrive)`。部分グラフの境界外接続は捨てています。NT符号、膜電位、生理パラメータ、筋肉への接続は推定しません。実測構造を計算で利用するという狭い意味でconnectome-derivedと分類し、生物学的な再現・脳エミュレーションは主張しません。

3個体は同じ標本の部分グラフの別実行instanceです。異なる3匹から測定した回路ではありません。各入力revisionはゼロ状態からの独立trialであり、生物の継続的神経状態や学習履歴ではありません。

## 出典と成果物の照合

`packages/bio_agent/connectome/male-cns-slice.json`に、元データ2ファイルのURLとSHA-256、抽出コードのSHA-256、選択条件、帰属と変更内容を記録しています。抽出データはCC BY 4.0です。帰属はMaleCNSのFlyEM / HHMI Janelia、University of Cambridge、MRC LMB、Google Research。データ提供者による本ゲームの承認を意味しません。

`scripts/build-circuit.mjs`は既存の共通ModelDescriptor形式で、graph / extraction / dynamics / sensoryMapping / motorMappingのexact-byte SHA-256参照を生成します。RegistryのmodelHashにはdescriptor自体のSHA-256を登録します。GUIは登録値と全ローカル参照のhashを照合し、不一致なら送信・実行を停止します。

これは配信された成果物の整合性検証です。大容量の元データをブラウザーで再取得すること、神経活動の正しさやブラウザーの実行証明を保証することとは別です。検証器はこの固定された回路bundle専用であり、任意profileに対応する汎用validatorではありません。

## 元データから再抽出

通常の起動にはコミットされた小さな抽出物だけで十分です。元データから検証する場合は約1 GBの取得とpyarrowが必要です。

```sh
python3 -m venv .local/connectome-tools
.local/connectome-tools/bin/pip install pyarrow==21.0.0
mkdir -p .local/connectome-source
curl --fail --location --retry 2 https://storage.googleapis.com/flyem-male-cns/v1.0/connectome-data/flat-connectome/body-annotations-male-cns-v1.0-minconf-0.5.feather -o .local/connectome-source/annotations.feather
curl --fail --location --retry 2 https://storage.googleapis.com/flyem-male-cns/v1.0/connectome-data/flat-connectome/connectome-weights-male-cns-v1.0-minconf-0.5.feather -o .local/connectome-source/weights.feather
.local/connectome-tools/bin/python scripts/extract-male-cns.py
git diff --exit-code -- packages/bio_agent/connectome/male-cns-slice.json
```

抽出スクリプトは取得ファイルから出典hashを再計算します。公式ファイルや抽出コードが変われば差分が出るため、新版としてレビューします。上流ファイルの署名認証ではありません。元データとPython環境はGit管理外です。

## 検証と証拠の範囲

- `npm run test:circuit`: 無刺激/強刺激/接続除去、checkpoint再開、壊れたグラフ、登録hash・成果物・出典整合性の拒否。
- `npm run test:circuit:browser`: 本物の3個体登録を読み、実TXで0→100%を入力し、wait→advanceを確認。receipt、英日切替、mobile、壊れた配信物と外部Originからの署名要求の拒否を確認。
- Exportした3個体×2条件×32tickを、標準ライブラリだけの独立Python計算で照合。絶対誤差1e-12以内。これは固定kernelの照合であり、共通profile全体の相互運用認証ではない。
- 元データから再抽出したJSONが同一であることを確認済み。

刺激1.0で平均応答は約0.150742、全接続除去では0。除去時も入力神経自体は活動しており、直接入力だけでreadoutが動いていないことを確かめます。これは依存性の検証で、任意のランダムグラフより優れているという証拠ではありません。

証跡: `artifacts/circuit-browser/evidence.json`（exportした全trace）、`verification.json`（ブラウザー検証）、desktop/mobile画像。

## API

`/api/circuit/config|snapshot|events|status|receipt`は既存のローカルRegistry APIと同じ形です。専用のRegistry、modelHash、deployment block/hashへ固定して既存実装を呼びます。loopback、Anvil 31337、同一Origin、所有者、revisionの検証を再利用し、汎用RPC proxyは公開しません。公開Workersにはこの書込APIを含めません。

## 補足動画

```sh
LOCAL_GUI_URL=http://127.0.0.1:8799 RECORD_CIRCUIT=1 npm run test:circuit:browser
```

英語GUIで刺激変更・回路と除去対照・receipt・出典を収録。出力は `artifacts/circuit-browser/bioagent-circuit-evidence-en.mp4`、音声なし。同じ出力先を上書きします。既存の2アプリ動画と併せて提出できます。
