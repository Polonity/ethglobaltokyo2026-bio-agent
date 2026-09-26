export const sources = [
  ['R1', 'Capture: receipts, model and learning deltas', 'capture-evidence.json'],
  ['R2', 'Shared market: actions, execution and limits', '../../apps/shared-market/README.md'],
  ['R3', 'Held-out experiment and negative results', '../../research/bioagent-adaptation/README.md'],
  ['R4', 'Framework: API, validation and restore', '../../../packages/bioagent-framework/README.md'],
  ['R5', 'Public Sepolia demo and transaction evidence', '../../deployment/sepolia.md'],
  ['R6', 'ETHGlobal Tokyo: official prize requirements', 'https://ethglobal.com/events/tokyo2026/prizes'],
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
      subtitle: '最初に短く答え、必要なら根拠を補足。2026-09-26収録版。',
      pitchTitle: '最初の30秒',
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
          '小さな計算環境で動く可能性は示せますが、比較優位はまだ言えません。',
          `収録時のPythonプロセス全体のpeak RSSは${rss} MiB、最後の4個体分の神経計算は${neural} ms。全システムのメモリーや電力ではありません。LLMの必要RAMはモデル等で変わり、一律256 GBではありません。同一課題での比較が必要です。`,
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
          '入力の解釈・出典・学習成果の互換性を、アプリごとに作り直す負担を減らせます。',
          'SolidityのIBioAgentは入力インターフェースです。別の7神経JSフレームワークが入力検証、学習→評価→採用、保存・復元を共通化し、用途違いや悪化候補を拒否します。全神経Python市場版は別実装。技能の用途間転移や開発時間短縮は未測定です。',
          'R4',
        ],
        [
          '何がオンチェーン？ 判断も検証できる？',
          '個体・モデル参照・入力revisionと、実際の決済を記録します。',
          '神経計算と学習はオフチェーンです。動画はchain 31337のAnvil forkで、公式Aquaのコードと実Transferログを確認。ハッシュは成果物照合用で、神経計算の正しさを証明するZK等ではありません。RPCへの信頼は残ります。',
          'R1, R4',
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
          '公開版では採餌・学習比較とRegistryへの実入力更新を試せます。公開ページからAqua／Uniswapの注文は送りません。動画では4個体と実際のテスト通貨交換を示します。',
          'R5',
        ],
        [
          '失敗から何を学んだ？ 次に何を測る？',
          '報酬を上げるだけでは不十分で、副作用も採用条件に含める必要があります。',
          '採餌では休息を減らして報酬を上げ、体力が悪化しました。次はUniswapの固定ペア・同額見積もりで実行／見送りを比較し、未使用相場で手数料控除後の結果・失敗率・見送り率と計算資源を測ります。',
          'R3',
        ],
        [
          'プライズ要件と残作業は？',
          'ローカルfork上の実移動は1inch要件に沿い、V3利用はUniswapの対象スタックです。',
          '受賞を保証するものではありません。公式要件（9/26確認）ではUniswapに公開リポジトリ、FEEDBACK.md、Developer Feedback Formが必要です。この作業ではフォーム未送信、FEEDBACK.md未作成、最新コミットの公開は別途確認が必要です。',
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
      subtitle: 'Lead with the short answer, then give the evidence. Recording: 26 Sep 2026.',
      pitchTitle: 'Your 30-second opening',
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
          'The resource footprint is measurable; comparative savings are not yet established.',
          `The shared Python process peaked at ${rss} MiB RSS; the last four-agent neural pass took ${neural} ms. These are not whole-system memory or energy measurements. LLM RAM depends on the model and configuration, not a universal 256 GB requirement. We need a matched-task benchmark.`,
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
          'Reusable input interpretation, provenance and policy compatibility checks.',
          'Solidity IBioAgent defines inputs. The separate seven-neuron JS framework shares validation, train/evaluate/adopt and save/restore, rejecting incompatible or worse candidates. The full Python market runtime is separate. Cross-task skill transfer and developer-time savings are not demonstrated.',
          'R4',
        ],
        [
          'What is onchain, and is inference trustless?',
          'Agent/model references, input revisions and actual settlement are recorded.',
          'Inference and learning run offchain. The video uses Anvil chain 31337, canonical Aqua code on a fork and real Transfer logs. Hashes identify artifacts; they are not proofs of correct neural computation. The chain reader trusts its RPC.',
          'R1, R4',
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
          'Visitors can observe foraging, compare learning and submit Registry inputs. The public page does not send Aqua/Uniswap orders. The video shows four full-population agents and real local test-token swaps.',
          'R5',
        ],
        [
          'What did failure teach you, and what comes next?',
          'Reward improvement needs side-effect constraints and matched controls.',
          'Foraging learned to rest less, raising reward while depleting energy. Next: compare execute/hold policies on identical Uniswap pair/size quotes, using unseen market regimes, fee-adjusted outcomes, failure/skip rates and resource measurements.',
          'R3',
        ],
        [
          'Does it fit the prizes, and what remains?',
          '1inch permits local-fork transfers; V3 is within Uniswap’s listed stack.',
          'Eligibility is not a prize guarantee. Requirements checked Sep 26 include a public repo, FEEDBACK.md and Uniswap’s Developer Feedback Form. This task did not submit the form or create FEEDBACK.md; publication of current commits still needs verification.',
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
