# BioAgent Framework

ブロックチェーン上のBioAgentを入力として受け取り、ハエ由来のコネクトームで判断するための、モノレポ内の実験用フレームワークです。採餌とAquaのアダプターが、入力の検証、判断の出典、学習候補の評価・採用、方策の保存・復元を共通化します。

[English](README.en.md) · [実験の結論](../../docs/research/bioagent-adaptation/README.md) · [実装](src/index.js)

## レイヤ構造

![BioAgent Framework: blockchain input, source validation, connectome engine, task runtime and applications](docs/layers.png)

imagegenで生成した構成図です。[生成プロンプト](docs/imagegen-prompt.txt)。図の実装対応は以下のとおりです。

| レイヤ | 責務 | 実装 |
| --- | --- | --- |
| 01 チェーン入力 | 個体のowner・modelHash・状態・revisionを保持 | [`IBioAgent`](../../contracts/src/interfaces/IBioAgent.sol)、[`BioAgentRegistry`](../../contracts/src/BioAgentRegistry.sol) |
| 02 取得・検証 | 同一ブロックで定義と状態を取得。chain・registry・個体・model・鮮度を照合 | [`EvmBioAgentSource`](src/evm-source.js)、[`ChainDecisionRunner`](src/chain-runner.js) |
| 03 コネクトーム | MaleCNS実測部分回路を、固定トポロジーと人工動力学で計算 | [`male-cns.js`](../bio_agent/connectome/male-cns.js)、[`circuit.js`](../bio_agent/connectome/circuit.js) |
| 04 判断・学習 | 入力を用途へ変換。学習・評価・採用・成果物の互換性を管理 | [`LearningBioAgent`](src/learning-agent.js)、[`ForagingBackend / AquaBackend`](src/adapters.js) |
| 05 アプリ | 判断の表示・記録、アプリ固有の処理 | [`Research Lab`](../../apps/research-lab/)、独自の利用アプリ |
| 共通の実行管理 | 同じArenaを複数個体から二重に進めない | [`SharedArenaClock`](src/shared-clock.js) |

Solidityの`IBioAgent`は**オンチェーン入力のインターフェース**です。JavaScriptの`LearningBioAgent`は既存の`IBioAgentRuntime`を継承し、オフチェーンの共通機能を追加します。名前が似ていても同じものではありません。既存の汎用TypeScript仕様全体に適合したという主張ではありません。

このv0.1のアダプターは**7神経・19接続の実測部分回路**を使います。全166,700神経版は[既存の別ランタイム](../../docs/design/malecns-full-local.md)にあり、このパッケージへ統合済みではありません。生物学的に妥当なハエの思考・全脳を再現したモデルではありません。

## まず動かす

Node.js 22.14以降、リポジトリ直下で実行します。パッケージはprivateで、現段階ではこのモノレポから利用します。npmへの公開は行っていません。

```sh
npm ci
npm run test:framework
npm run framework:lab
# http://127.0.0.1:8826/
```

Research Labは採餌とAquaを切り替え、`学習 → 評価 → 採用 → 保存 → 復元`を操作できます。刺激変更と次の判断も確認できます。ここでの保存はブラウザーのメモリー内です。永続保存には下記の`exportPolicy()`が返すJSONをファイルやアプリのストレージに保存します。

```sh
# 未使用環境での比較結果を再生成
npm run research:adaptation
# Foundryのforge/anvilが必要。別プロセスの一時Anvilへだけテスト用TXを送る
npm run test:framework:chain
# 実ブラウザーの操作・日英表示・復元・EVM記録再生を確認
npm run test:framework:browser
```

EVM検証は空きポートに自分のAnvilを起動し、終了時にそのプロセスだけを停止します。既存GUIや既存チェーンは変更しません。`FORGE`/`ANVIL`環境変数で実行ファイルを指定できます。ブラウザー検証にはGoogle Chromeが必要です。比較実験とEVM検証を先に実行してください。

## 共通APIを使う

次のコードはリポジトリ直下のESMファイルから実行できます。`AquaBackend`に差し替えてもライフサイクルAPIは同じです。用途の異なる方策そのものを転用するAPIではありません。

```js
import { LearningBioAgent } from './packages/bioagent-framework/src/index.js';
import { ForagingBackend } from './packages/bioagent-framework/src/adapters.js';

const agent = new LearningBioAgent(
  { id: 'fly-1', owner: '0x1111111111111111111111111111111111111111' },
  new ForagingBackend({ seed: 42 }),
);
agent.observe({ activity: 2, energy: 7000, stimulus: 5500 });
const profiles = [{ name: 'default', energy: 0.7, stimulus: 0.55 }];
agent.train({ seed: 310001, seeds: [311000, 311019], profiles, ticks: 300, trials: 16 });
const selection = agent.evaluate({ seeds: [312000, 312019], profiles, ticks: 300 });
const adoption = agent.adopt(); // 条件不成立なら以前の方策を保持
const artifact = await agent.exportPolicy();
await agent.restorePolicy(artifact);
console.log({ selection, adoption, decision: agent.step(), state: agent.snapshot() });
```

| API | 意味 |
| --- | --- |
| `observe(status)` | アダプターへ状態入力を渡す。チェーン由来入力には下記Runnerを使う |
| `step(0.2)` / `snapshot()` | 1ステップの判断 / 現在状態。採用済み方策が次の判断から反映される |
| `train(config)` | 候補を作る。稼働中の方策は変更しない |
| `evaluate(config)` | 候補と現行方策を同じ選択条件で比較。学習seedとの重複を拒否 |
| `adopt()` | アダプターの採用条件を満たせば更新。未評価の候補は採用不可 |
| `exportPolicy()` / `restorePolicy(json)` | identity・task・model・encoder・dynamics・readout・actionSpace・versionを結び付けたJSON |

採餌の採用条件は、**各選択profileで報酬が改善し、餌が減らず、接触が増えないこと**。Aquaは人工目標へのMSE低下です。採餌では`new ForagingBackend({ minimumFinalEnergy: 0.8 })`のように、終了時の平均エネルギーの下限も指定できます。この制約はartifactの互換性にも含まれます。0.8は説明用の値で、推奨値ではありません。SHA-256は成果物の内容照合であり、作者の署名ではありません。互換性IDは変更時に更新する必要があります。復元するのは方策で、環境・身体・時計の完全checkpointではありません。復元すると保留中の候補・評価は破棄されます。

## ブロックチェーンから判断まで

[`read-chain.mjs`](examples/read-chain.mjs)は公開RPCの読み取りだけで動き、秘密鍵・署名・トークン承認を使いません。既存Registryの`getAgent`と`getStatus`を同じブロックで読みます。純粋な`IBioAgent`だけで`getAgent`を持たない契約には、別のsourceアダプターが必要です。

```sh
node packages/bioagent-framework/examples/read-chain.mjs \
  RPC_URL CHAIN_ID REGISTRY_ADDRESS AGENT_ID aqua 2
# 最後に保存済み方策JSONのパスを追加可能。同じidentity/bindingのみ復元可能。
```

`2`は最新headから2ブロック遡る設定で、確定性の保証ではありません。ローカル即時検証では明示的に`0`を指定します。RegistryのmodelHashはこのアダプターのMaleCNSグラフhashと一致する必要があります。判断前に実際のグラフファイルのSHA-256を検証します（プロセス内でキャッシュ）。判断出力にはブロックhash、入力revision、モデル・変換の識別子、方策version/hashを含めます。

入力は最後に取得したブロックの時刻から既定120秒で失効します。更新revisionが同じでも新しいブロックから読み直せます。古いrevisionや同じブロック番号で異なるhashは拒否し、再同期が必要です。深いreorgの自動回復やRPCの独立検証は未実装です。RPCの信頼を前提とし、`observe()`へ任意の外部JSONを渡すことはチェーン検証の代わりになりません。

このパッケージの出力は判断までです。実行先の認可、取引・装置制御、実行前の最新状態確認は利用アプリ側の責務です。

## 複数個体で同じ環境を共有する

```js
import { Arena } from './packages/bio_agent/browser/arena.js';
import { ForagingBioAgent } from './packages/bio_agent/runtime/agents.js';
import { SharedArenaClock } from './packages/bioagent-framework/src/index.js';

const arena = new Arena(42, { agentCount: 2 });
const owner = '0x1111111111111111111111111111111111111111';
const agents = [1, 2].map(id => new ForagingBioAgent({ id: String(id), owner }, arena, id));
const clock = new SharedArenaClock(agents);
clock.advance(1); // 環境は0.2秒、各個体は1判断だけ進む
clock.advance(1); // 同一tickは重複実行しない
clock.advance(2);
```

この時計を使うループでは個体の`step()`や`arena.tick()`を別途呼ばないでください。既存APIへの直接アクセスを禁止する仕組みではありません。対象は既存Foragingアダプターで、独自の鮮度規則を持つ価格・Swapアダプターの時計は統合していません。

## 新しい用途を追加する

backendに`binding`、`initial`、`validate`、`fit`、`evaluate`、`gate`、`observe`、`step`、`snapshot`を実装し、`LearningBioAgent`へ渡します。[採餌・Aqua実装](src/adapters.js)が動く例です。

- `binding`は用途、入力変換、動力学、出力解釈の互換性境界です。
- `fit`は評価用データを見ずに候補を返します。`evaluate`は現行と候補を同条件で比較します。
- `gate`は副作用を含む採用基準です。学習の損失低下とアプリの有用性を混同しないでください。
- backendは信頼された実装です。プラグインの隔離実行、非同期・大規模学習、モデル配信はこの版の範囲外です。

## 実験で分かったこと

未使用60環境・5探索seed・300step/環境の採餌実験では、標準条件の平均報酬が**18.79 → 56.12**、餌が**6.80 → 20.84**、接触が**1.25 → 0.10**になりました。学習対象は3個の行動変換係数で、神経接続は固定です。保存した方策JSONは約600 bytesですが、これはランタイムのRAMや電力消費ではありません。

同じ予算で入力を直接使う対照は**56.08**で、回路を通す利点は確認できませんでした。特定の固定ルールは**49.05**ですが、接触は**0.083**と学習版よりわずかに少なく、全面的に上回ったわけではありません。学習版は休息を大幅に減らした一方、終了時エネルギーは0.722 → 0.361、低エネルギーstepは0 → 48.50と悪化しました。体力も守る用途では追加の採用制約が必要です。今回の危険回避追加の有無では結果が変わらず、改善をその機能の効果とは言えません。

提供価値は、**接続元と判断の根拠を追い、学習候補の成功・失敗を同じ枠組みで比較し、検証済み方策を再利用できること**です。Uniswap/Aquaに対する利用者数・実収益・電力削減効果はまだ検証していません。詳しい統計、初回の失敗、適用限界は[研究記録](../../docs/research/bioagent-adaptation/README.md)にあります。
