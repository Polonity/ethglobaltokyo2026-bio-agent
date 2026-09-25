# IBioAgent・Registry・Status・イベント

状態: **Solidity 実装・Foundry テスト済み / 未デプロイ**。正確な型と custom error は [IBioAgent](../../contracts/src/interfaces/IBioAgent.sol)・[IBioAgentRegistry](../../contracts/src/interfaces/IBioAgentRegistry.sol) を参照。

## 責務と識別

`IBioAgent` はチェーン上の Agent の共通契約とする。`BioAgentRegistry` がこれを実装し、`agentId` ごとに登録情報と最新 Status を保持する。各 Agent は Registry 内のレコードであり、独立したコントラクトアドレスを持たない。

`agentId` は Registry が1から連番で採番し、0は未登録を表す。チェーンをまたぐ識別には必ず chainId と Registry アドレスを組み合わせる。Registry の登録情報は Runtime の起動状態を保証しない。

## 型の概要

```solidity
interface IBioAgent {
    enum Activity { Rest, Explore, Forage }

    struct BioAgentStatus {
        Activity activity;
        uint16 energy;       // 0..10000: 正規化されたデモ入力
        uint16 stimulus;     // 0..10000: 刺激強度
        uint64 revision;     // contract が採番。初期登録時は1
        uint64 updatedAt;    // contract が block.timestamp を設定
    }

    event BioAgentStatusUpdated(
        uint256 indexed agentId,
        uint64 indexed revision,
        address indexed writer,
        Activity activity,
        uint16 energy,
        uint16 stimulus,
        uint64 updatedAt
    );

    function getStatus(uint256 agentId)
        external view returns (BioAgentStatus memory);

    function updateStatus(
        uint256 agentId,
        uint64 expectedRevision,
        Activity activity,
        uint16 energy,
        uint16 stimulus
    ) external;
}

interface IBioAgentRegistry is IBioAgent {
    struct BioAgentDefinition {
        address owner;
        bytes32 modelHash;  // 実行に必要なモデル一式のmanifestのSHA-256
        string metadataURI;
    }

    event BioAgentRegistered(
        uint256 indexed agentId,
        address indexed owner,
        bytes32 indexed modelHash,
        string metadataURI
    );

    function registerAgent(bytes32 modelHash, string calldata metadataURI)
        external returns (uint256 agentId);

    function getAgent(uint256 agentId)
        external view returns (BioAgentDefinition memory);
}
```

以下の実装には入力制約、custom error、Foundry テストがある。上の抜粋は error 宣言を省略しており、ABI の正本は Solidity ソースから生成した `contracts/abi/` とする。`IBioAgentRegistry` は `IBioAgent` を継承する共通 Registry API であり、EIP/ERC 準拠やトークンを意味しない。

## 登録と更新のルール

| 操作 | 検証 | 状態変更とイベント |
| --- | --- | --- |
| registerAgent | modelHash は非ゼロ。metadataURI は1..512バイト（UTF-8 妥当性は検証しない） | owner = msg.sender。定義を保存。初期 Status = Rest / energy 5000 / stimulus 0 / revision 1。Registered → StatusUpdated の順に同一 Tx で emit |
| updateStatus | 登録済み、msg.sender = owner、energy/stimulus は0..10000、expectedRevision = 現在のrevision | Status を置換し revision を1増加。StatusUpdated を1件 emit |
| getAgent / getStatus | 登録済み | 最新値を返す。未知 ID は revert |

登録情報は v0.1 では不変。モデル変更は別 Agent 登録として扱う。同じ値を再度設定しても新しい revision として受理し、再刺激できる。競合した更新は revert し、GUI が最新値を読んで再入力を促す。revision の加算オーバーフローは revert する。

書込権限、未知 ID、範囲外入力、revision 競合にはそれぞれ識別可能な custom error を定義している。無効 enum 値は ABI デコード時も含め拒否する。コントラクトは外部 URI を取得せず、URL の内容も検証しない。

## Status と RuntimeState の違い

| | BioAgentStatus（チェーン） | RuntimeState（オフチェーン） |
| --- | --- | --- |
| 意味 | owner が与えた活動条件・刺激 | Agent が計算した現在の状態と行動 |
| 例 | Forage、energy 8000、stimulus 9000 | 位置、向き、速度、活性、選択された行動 |
| 更新頻度 | ユーザー操作ごと | シミュレーションの tick ごと |
| 書込主体 | owner のウォレット | 稼働中の Agent Runtime |

`Activity` はモデルへの文脈入力で、動きを直接指定する座標ではない。学習済みモデルの解釈はモデル manifest で定義する。デモ用モデルは活動別の行動傾向を明示した決定的ルールを使用する。Status の記録は生体状態の計測・実行の証明ではない。

## モデルとメタデータ

manifest には `schemaVersion`、モデル種別（demo / MaleCNS）、回路データの版・ハッシュ、重みハッシュ、入力正規化、行動出力、ランタイム版、再生用 seed 方針を含める。`modelHash` は公開する manifest ファイルの**正確なバイト列**の SHA-256 とし、その中に各成果物のハッシュを記録する。

metadataURI は名前・説明・manifest の取得先を持つメタデータを指す。Runtime は取得した manifest と成果物をハッシュ照合し、未対応モデル・不一致なら起動しない。URI からプログラムを自動実行せず、インストール済みモデル実装へ対応付ける。

## イベントと出典

StatusUpdated は差分でなく、その revision の Status 全体を持つ。古いイベントを処理する際に `getStatus(latest)` で置き換えると当時の入力が失われるため、ログの値を使う。登録時の初期 Status も同じイベントとして処理する。

ABI の indexed 引数はログの topics に対応するため、agentId や event signature を受信条件に使う。[Solidity ABI 仕様](https://docs.soliditylang.org/en/latest/abi-spec.html#events)

ABI、コントラクトアドレス、デプロイブロック、chainId を版管理する。互換性のない変更は新 Registry にデプロイし、v0.1 では upgradeable proxy を導入しない。
