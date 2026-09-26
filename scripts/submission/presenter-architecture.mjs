// Current implementation boundaries; shared by the appendix and presenter notes.
export const architecture = {
  ja: {
    tag: 'APPENDIX · 実行境界と言語',
    title: 'どこで動き、何を境界越しに渡すか',
    headers: ['境界', '実装言語・実行環境', '担当すること', '境界を渡るデータ'],
    rows: [
      [
        'ブラウザー',
        'JavaScript / HTML / CSS',
        '公開：7神経・Q学習\n全神経版：操作・表示',
        'HTTP / JSON\n確定入力・表示状態',
      ],
      [
        '読取ゲートウェイ',
        'JavaScript\nCloudflare Workers',
        'receipt・イベント検証\nAnvilも読取処理を共有',
        'JSON-RPC\nブロック・logs・receipt',
      ],
      [
        '署名者',
        'JavaScript + ethers\nWorker / wallet / Anvil',
        '所有者の権限でTX送信\n定期送信は予算を制限',
        'ABI・署名付きTX\n秘密鍵はブラウザーへ返さない',
      ],
      [
        'ローカル制御',
        'JavaScript / Node.js',
        '全神経の世界・報酬・発注\n通常コードが経路を比較',
        'HTTP / JSON ↔ UI\nJSON Lines ↔ Python',
      ],
      [
        '全神経ランタイム',
        'Python / NumPy / SciPy',
        '166,700神経・行動readout\n採餌の選択／市場の更新',
        '数値入力 → 行動\n結果 → 学習・保存',
      ],
      [
        'EVMコントラクト',
        'Solidity 0.8.30\n自作部分の言語',
        '個体・モデル参照・環境入力\n所有者制約・市場決済',
        'ABI / events\nチェーン状態・成功receipt',
      ],
    ],
    boundary:
      '共有型：TypeScriptの仕様案。学習状態はブラウザー／ローカル保存。Workersで全神経計算は行いません。',
    bullets: [
      '公開版：Browser JS ← HTTP/JSON → Workers JS ← JSON-RPC → Solidity',
      '全神経版：Browser JS ← HTTP/JSON → Node.js ← JSON Lines → Python',
      '署名と決済は別の責務。Pythonの判断だけではTXは発行されない',
    ],
    notes:
      '公開版はJavaScriptの7神経計算とQ学習をブラウザー内で実行します。Workersは静的配信と検証済み入力の取得を担当し、定期送信はWorker Secretの所有者鍵とDurable Objectの送信記録を使います。手動Sepolia送信は所有者のブラウザーwallet、Anvilはローカルアカウントです。全神経版はNode.jsが世界、報酬、署名・取引を制御し、Python子プロセスとstdin/stdoutのJSON Linesで通信します。Pythonは166,700神経と学習readoutを計算し、秘密鍵を使いません。採餌経験はSQLite、市場readoutはJSON、公開方策と餌消費履歴はlocalStorageへ保存します。Solidityはowner、revision/nonce、入力と決済を扱い、推論や学習は実行しません。TypeScriptの共有型は仕様案で、全ランタイムへ統合済みではありません。独立JSフレームワークも別実装です。詳細：docs/architecture.md。',
  },
  en: {
    tag: 'APPENDIX · BOUNDARIES & LANGUAGES',
    title: 'Where code runs and what crosses each boundary',
    headers: ['Boundary', 'Language / runtime', 'Responsibility', 'Data crossing it'],
    rows: [
      [
        'Browser',
        'JavaScript / HTML / CSS',
        'Public: 7 neurons + Q-learning\nFull mode: controls + display',
        'HTTP / JSON\nVerified inputs / view state',
      ],
      [
        'Read gateway',
        'JavaScript\nCloudflare Workers',
        'Verify receipts and events\nAnvil shares the read logic',
        'JSON-RPC\nBlocks, logs, receipts',
      ],
      [
        'Signer',
        'JavaScript + ethers\nWorker / wallet / Anvil',
        'Owner-authorized TXs\nBudget-capped scheduled sends',
        'ABI / signed TXs\nNo server key returned to UI',
      ],
      [
        'Local controller',
        'JavaScript / Node.js',
        'Full world, rewards, execution\nOrdinary code compares routes',
        'HTTP / JSON ↔ UI\nJSON Lines ↔ Python',
      ],
      [
        'Full-neuron runtime',
        'Python / NumPy / SciPy',
        '166,700 neurons + readouts\nForaging selection / market updates',
        'Numeric inputs → actions\nOutcomes → learning / storage',
      ],
      [
        'EVM contracts',
        'Solidity 0.8.30\nProject-owned contracts',
        'Identity, model refs, world inputs\nOwner checks / market settlement',
        'ABI / events\nChain state / successful receipts',
      ],
    ],
    boundary:
      'Shared types: a TypeScript proposal. Policies stay in browser/local storage. Full-neuron computation does not run in Workers.',
    bullets: [
      'Public: Browser JS ↔ HTTP/JSON ↔ Workers JS ↔ JSON-RPC ↔ Solidity',
      'Full: Browser JS ↔ HTTP/JSON ↔ Node.js ↔ JSON Lines ↔ Python',
      'Signing and settlement are separate; a Python decision alone sends no TX',
    ],
    notes:
      'Public mode computes seven-neuron decisions and Q-learning inside the JavaScript browser runtime. Workers serves assets and verified inputs. Its scheduled writer uses the owner key in a Worker Secret and a Durable Object send journal. Manual Sepolia writes use the owner browser wallet; Anvil uses local accounts. Full mode places world/reward/execution logic in Node.js, which communicates with a Python child over stdin/stdout JSON Lines. Python computes 166,700 neurons and learned readouts; it does not use signing keys. Foraging experience lives in SQLite, market readouts in JSON, and public policies/consumed-food history in localStorage. Solidity enforces owners, revisions/nonces, inputs and settlement; it does not perform inference or learning. Shared TypeScript types are a proposal, not universal runtime integration. The independent JS framework is also a separate implementation. Details: docs/architecture.en.md.',
  },
};
