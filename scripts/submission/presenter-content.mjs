export const sources = [
  ['R1', 'Capture: receipts, model and learning deltas', 'capture-evidence.json'],
  ['R2', 'Shared market: actions, execution and limits', '../../apps/shared-market/README.md'],
  ['R3', 'Held-out experiment and negative results', '../../research/bioagent-adaptation/README.md'],
  ['R4', 'Framework: API, validation and restore', '../../../packages/bioagent-framework/README.md'],
  ['R5', 'Public Sepolia demo and transaction evidence', '../../deployment/sepolia.md'],
  ['R6', 'Current environment-TX and scheduled sender evidence', '../judge-demo-review.md'],
];

export function content(e) {
  const swaps = e.newRoutes.Aqua + e.newRoutes['Uniswap V3'];
  const updates = e.policyChanges.map((x) => x.updatesAfter - x.updatesBefore);
  const changed = e.policyChanges.filter((x) => x.weightsChanged).length;
  const rss = e.after.metrics.peakRSSMiB.toFixed(1);
  const neural = e.after.metrics.neuralMs.toFixed(1);
  return {
    ja: {
      label: '日本語',
      title: 'BioAgent｜発表・質疑応答',
      subtitle: '現行の共通Fly Labに対応。市場動画・独立研究の結果は明示して区別。',
      pitchTitle: '全神経動画を補足するとき（約30秒）',
      pitch:
        'BioAgentは、生物由来の神経回路で行動を決め、入力・学習・取引結果を追える実験基盤です。動画では4個体が各166,700神経で、Aquaの提示とUniswapの売買に関わります。実取引と学習更新を確認しました。別の採餌実験では行動が改善しましたが、通常モデルへの優位は未確認です。そこまで比較できる基盤を作ったことが成果です。',
      stats: [
        ['166,700', '神経／個体 × 4個体'],
        [String(swaps), `新規決済：Aqua ${e.newRoutes.Aqua}・V3 ${e.newRoutes['Uniswap V3']}`],
        [`${updates[0]}回 × 4`, `学習更新。重み変化は${changed}個体`],
      ],
      page1Title: '価値と結果を答える',
      page2Title: '実装・検証範囲を答える',
      questions: [
        [
          '普通のAI Agentと何が違う？',
          '生物の実測接続を、行動判断の特徴計算に使います。',
          '外から見れば同じ取引botです。差はモデルの由来と内部構造です。動力学・入力変換・行動変換は人工設計で、ハエの感情や意識を読み取ったものではありません。',
          'R1, R2',
        ],
        [
          'BioAgentならではの利点は実証できた？',
          'この課題で、生物由来であることの性能優位は未確認です。',
          '仮説は、固定された疎な回路と小さい学習部分で環境変化に対応できること。通常モデルでも学習・省メモリー化は可能です。同条件の対照と比較できることが現時点の成果です。',
          'R3',
        ],
        [
          'Uniswap／1inchチームにどんな価値がある？',
          '判断モデルを実際の決済まで接続して検証できる、参照実装です。',
          'Uniswapには、見積もり→実行／見送りを比較する実験の入口。Aquaには、同じ保有資金からの提示・撤回を学習モデルへ接続する例を提供します。利用者数、取引量、資本効率の増加は未測定です。',
          'R2, R3',
        ],
        [
          '動画では何を学習している？',
          '確定した行動結果から、行動を選ぶreadoutの重みを更新します。',
          `実測の神経接続は固定です。今回${updates[0]}周期で全4個体の更新数が増え、${changed}個体の重みが変化しました。報酬は提示の約定結果や目標保有比率への接近です。市場版はオンライン更新で、未使用データによる採用ゲートはありません。`,
          'R1, R2',
        ],
        [
          '動いただけでなく、改善効果はある？',
          '別の7神経・人工採餌実験では、未使用環境で報酬が18.79→56.12へ改善しました。',
          '同予算の直接入力モデルも56.08で、生物優位は確認できませんでした。接触は平均1.25→0.10、終了時エネルギーは0.722→0.361に低下。5探索seed・60テスト環境／条件の結果で、動画の市場成績とは別です。',
          'R3',
        ],
        [
          'LLMより低コスト・低消費電力？',
          '定型判断の計算・更新を小さくし、電力・設備費・待ち時間を減らす可能性を調べています。',
          `収録時のPythonプロセス全体のpeak RSSは${rss} MiB、最後の4個体分の神経計算は${neural} ms。電力は未測定で、比較優位の証拠ではありません。比較条件と想定反論は4ページ目にまとめています。`,
          'R1',
        ],
        [
          'ハエが取引先まで決めている？',
          '神経モデルが行動を選び、通常コードが実行可能な見積もりを比較します。',
          '提示側はtight／wide／withdraw、売買側はhold／buy／sell。学習値に人工設計の基準値と探索を加えます。AquaかV3かはガス控除前の受取量で選択。独自FlyV3RouterとV3 coreを使用し、Trading API・Universal Router・v4 hooksは未使用です。',
          'R2',
        ],
        [
          'IBioAgentを共通化するうまみは？',
          '入力とモデルの意味を共通化し、検証・学習の処理を再利用することを目指します。',
          'SolidityのIBioAgentは個体・Statusの共通API、IBioAgentStimulusは環境payloadを扱います。Anvil／Sepolia箱庭はUIとQ学習を共有。独立JSフレームワークの採用・復元APIや全神経Python市場版まで、単一の学習器に統合したわけではありません。',
          'R4',
        ],
        [
          '何がオンチェーン？ 判断も検証できる？',
          '箱庭の外部入力はすべてオンチェーンデータです。',
          '初期環境TXに危険エリアも記録。正の刺激TX確定ごとに餌が1個増え、食べると消えます。位置・身体・消費・学習はオフチェーンで、ブラウザー間では入力を共有します。receipt確認は最終確定や神経計算の正しさの証明ではありません。',
          'R5, R6',
        ],
        [
          'PnLは利益？ 安全に自動売買できる？',
          'テスト通貨の評価損益で、利益・運用安全性を実証したものではありません。',
          '需要は目標比率85%／15%の人工設定。PnLに交換費用は反映され、ガス代はETHで別表示です。提示側2個体は1つのEOAを共有します。数量・期限などの実行条件はありますが、監査済み製品ではありません。',
          'R1, R2',
        ],
        [
          '審査員が公開URLで試すものも全神経？',
          '公開ページはSepolia＋7神経、提出動画はAnvil＋全166,700神経です。',
          '公開版は3個体で、確認済み環境を再生するQ学習です。新旧方策の比較スコアが改善した時だけ採用します。市場動画の4個体・readoutオンライン更新とは別。動画は環境TX対応前の記録です。',
          'R5',
        ],
        [
          '失敗から何を学んだ？ 次に何を測る？',
          '報酬を上げるだけでは不十分で、副作用も採用条件に含める必要があります。',
          '採餌では休息を減らして報酬を上げ、体力が悪化しました。次はUniswapの固定ペア・同額見積もりで実行／見送りを比較し、未使用相場で手数料控除後の結果・失敗率・見送り率と計算資源を測ります。',
          'R3',
        ],
        [
          '誰がTXを送る？ 審査員も送れる？',
          '所有者EOAが署名し、Workersも同じ所有者鍵で定期送信します。',
          '鍵はCloudflare Secretに保管。毎時確認・最低1時間間隔でAgent #1に送信し、ガス・残高を制限します。観察と学習はウォレット不要。手動送信は所有者のみで、スマートウォレットではありません。餌はTX以外で自動補充しません。',
          'R6',
        ],
      ],
      boundary:
        '言い切る：実接続を使う・取引が成立・学習更新を確認。言い切らない：ハエの思考・生物優位・利益・LLMより安い・フル版と縮小版の同等性。',
      footer: 'R1〜R6の参照先は下記リンク／同梱README。公開デモと動画の範囲を混同しない。',
    },
    en: {
      label: 'English',
      title: 'BioAgent | Presenter Q&A',
      subtitle:
        'Current shared Fly Lab. Recorded market results and independent research are labelled separately.',
      pitchTitle: 'Optional: introduce the full-market video',
      pitch:
        'BioAgent is an experimental platform that connects biologically derived circuits to traceable actions. Four agents, each using 166,700 neurons, make Aqua offers and trade through Uniswap. We verified real local settlement and learning updates. A separate foraging experiment improved behavior, but did not outperform a matched non-biological model. Our contribution is a working platform for testing these possibilities and their limits.',
      stats: [
        ['166,700', 'neurons per agent × 4 agents'],
        [String(swaps), `new settlements: ${e.newRoutes.Aqua} Aqua · ${e.newRoutes['Uniswap V3']} V3`],
        [`${updates[0]} × 4`, `learning updates; ${changed} agents changed weights`],
      ],
      page1Title: 'Explain the value and results',
      page2Title: 'Explain implementation and scope',
      questions: [
        [
          'How is this different from an ordinary AI agent?',
          'Measured biological connectivity participates in the action features.',
          'From the ecosystem, it still looks like a trading bot. The distinction is model provenance and internal structure. Dynamics, encoding and decoding are engineered; this is not a measurement of a fly’s feelings or consciousness.',
          'R1, R2',
        ],
        [
          'Have you demonstrated a uniquely biological advantage?',
          'Not on the task we tested.',
          'Our hypothesis is that a fixed sparse circuit plus a small learned readout could adapt efficiently. Ordinary models can also learn and use little memory. We built a way to compare these possibilities under matched conditions; superiority remains unproven.',
          'R3',
        ],
        [
          'What value do Uniswap and 1inch receive?',
          'A reference implementation connecting alternative decision models to real settlement.',
          'For Uniswap: an entry point for comparing quote-based execute/hold policies. For Aqua: learned offer/withdraw decisions using shared self-custodied liquidity. User growth, routing volume and capital-efficiency gains are hypotheses, not measured outcomes.',
          'R2, R3',
        ],
        [
          'What learns during the video?',
          'The action readout updates from confirmed outcomes; neural connections stay fixed.',
          `All four agents received ${updates[0]} outcome updates; ${changed} changed saved weights. Rewards reflect offer fills or progress toward target holdings. This full-market runtime updates online, without a held-out adoption gate. Updates alone do not establish a better trading policy.`,
          'R1, R2',
        ],
        [
          'What improved beyond simply running the demo?',
          'A separate seven-neuron foraging experiment improved held-out reward: 18.79 → 56.12.',
          'A matched direct-input learner scored 56.08, so biological superiority was not established. Mean contacts fell 1.25 → 0.10, but final energy fell 0.722 → 0.361. Five search seeds and 60 unseen worlds per profile; these are not market results.',
          'R3',
        ],
        [
          'Is it cheaper or more energy-efficient than an LLM?',
          'We aim to reduce the compute and update costs of routine decisions, potentially saving energy, hardware and time.',
          `The shared Python process peaked at ${rss} MiB RSS; the last four-agent neural pass took ${neural} ms. Power is unmeasured; these are not comparative savings. Page 4 gives the hypotheses, counterarguments and comparison conditions.`,
          'R1',
        ],
        [
          'Does the fly choose the trading venue?',
          'The neural model selects an action; ordinary code compares executable quotes.',
          'Makers choose tight/wide/withdraw; traders hold/buy/sell, using learned scores plus engineered priors and exploration. Venue selection compares output before gas. We use V3 core and our FlyV3Router—not Trading API, Universal Router or v4 hooks.',
          'R2',
        ],
        [
          'What does the shared BioAgent interface provide?',
          'A shared meaning for inputs and models, with reusable validation and learning components.',
          'Solidity IBioAgent defines identity/Status; IBioAgentStimulus carries environment payloads. Anvil/Sepolia share UI and Q-learning. The independent JS framework and full Python market runtime have separate learners. This is not one universal learning engine or demonstrated skill transfer.',
          'R4',
        ],
        [
          'What is onchain, and is inference trustless?',
          'All external inputs to the playground come from onchain data.',
          'The initial TX includes hazards; each confirmed positive stimulus adds one food, removed when eaten. Position, body, consumption and learning run offchain. Browsers share inputs, not body state. Receipt checks do not establish finality or correct neural computation.',
          'R5, R6',
        ],
        [
          'Does PnL prove profit or safe autonomous trading?',
          'It is test-token mark-to-market accounting, not a profitability or safety result.',
          'Demand is manually set to 85%/15% target holdings. Swap costs affect PnL; ETH gas is shown separately. Two makers share one EOA. Execution has quantity/deadline checks, but this is not an audited trading product.',
          'R1, R2',
        ],
        [
          'Does the public demo run the full population?',
          'The public demo is Sepolia + 7 neurons; the video is Anvil + 166,700 neurons per agent.',
          'The public page has three agents, Q-learning on confirmed-world replays, and a score-based adoption gate. The four-agent market video uses separate online readout updates and predates environment TXs. Public Sepolia does not trade on Aqua/Uniswap.',
          'R5',
        ],
        [
          'What did failure teach you, and what comes next?',
          'Reward improvement needs side-effect constraints and matched controls.',
          'Foraging learned to rest less, raising reward while depleting energy. Next: compare execute/hold policies on identical Uniswap pair/size quotes, using unseen market regimes, fee-adjusted outcomes, failure/skip rates and resource measurements.',
          'R3',
        ],
        [
          'Who sends TXs? Can judges send them?',
          'The owner EOA signs; Workers uses the same owner key for scheduled sends.',
          'The key stays in a Cloudflare Secret. Hourly checks send to Agent #1 at least an hour apart, subject to gas and balance limits. Viewing and learning need no wallet; manual writes require the owner. This is not a smart wallet. Food never refills without a TX.',
          'R6',
        ],
      ],
      boundary:
        'Say: measured connectivity, successful settlement, observed learning updates. Do not claim: fly thoughts, biological superiority, profit, lower LLM cost, or equivalence of full and reduced runtimes.',
      footer:
        'R1–R6: links below / companion README. Keep the public demo and recorded full runtime distinct.',
    },
  };
}
