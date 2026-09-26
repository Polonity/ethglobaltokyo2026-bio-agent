// One source for the opening sheet, presentation slides and speaking notes.
const base = {
  ja: {
    title: 'BioAgent｜目的からデモまで',
    goalTitle: '何を実現したいか',
    goal: '生物由来の小さな判断モデルを、オンチェーン入力で動かし、経験から適応させる。その効果と計算資源を比較できるフレームワークをつくります。',
    value:
      '使う人はAgentの開発者・研究者。入力の検証、モデルの出典、学習結果の追跡を再利用し、生物回路が役立つ条件を調べられることが価値です。',
    stepsTitle: '公開デモは、この順に説明する',
    steps: [
      [
        '1｜開く',
        'Sepoliaページをウォレットなしで開き、3個体を選んで観察。「判断する部分は実測7神経・19接続を使います。」',
      ],
      [
        '2｜環境の出典を見る',
        '「環境と餌の入力TX」を開き、初期環境TXを示す。「幅・高さ・危険エリアも、最初のTXに記録しました。」',
      ],
      [
        '3｜刺激から行動へ',
        '餌の元TXと行動を示す。「正の刺激TXが確定すると餌が1個増え、感覚入力へ変換して移動・休息を選びます。」',
      ],
      [
        '4｜学習を確かめる',
        '個体を選び「学習室へ」。「確認済み環境のコピーと経験からQ値を更新し、比較スコアが改善した候補だけ採用します。」',
      ],
      [
        '5｜結果を読む',
        '学習前／候補・採用／維持を確認。「同じ環境の再生での比較です。未知環境への効果は、別の比較実験で調べます。」',
      ],
    ],
    caution:
      '定期送信は毎時確認・最低1時間間隔。1分の説明では記録済みTXを使います。手動送信は所有者のみ。餌を食べ切ると休息し、自動補充しません。学習で改善しない結果も有効です。',
    scopeTitle: '3つの証拠を使い分ける',
    scope: [
      ['現在の公開ページ', 'Sepolia・7神経・3個体。TX入力と採餌・Q学習を体験。'],
      ['提出動画', 'Anvil・全166,700神経。前半は2個体の環境TXと学習比較、後半は4個体のAqua／V3決済。'],
      ['独立した研究', '合成採餌環境の対照比較。報酬は改善したが、生物回路の優位は未確認。'],
    ],
    pitchTitle: '約1分の説明原稿',
    pitch:
      '私たちが作りたいのは、生物由来の判断モデルをアプリで使い、学習の効果まで確かめられるフレームワークです。まず、危険エリアを含む初期環境をTXに記録します。次に、確定した刺激TXで餌を追加し、ハエが移動や休息を選びます。学習では、その環境と経験を再生し、改善した候補を採用します。ここで示すのは、入力から判断・学習までを追える仕組みです。別の対照実験では報酬は改善しましたが、生物回路の優位は確認できませんでした。次は、同じ仕事で小型AIと比べ、適応の速さと計算資源に利点があるかを測ります。',
    slides: [
      [
        '目的',
        '生物由来の判断を、使って検証できる基盤へ',
        [
          '対象：Agentの開発者・研究者',
          '狙い：小さな計算で反復判断と適応',
          '成果：入力・モデル・学習結果を追跡できる実装',
        ],
        '省電力・通常AIへの優位は、これから比較する仮説です。',
        'まず何を改善したいかを話す。定型的な判断の運用負担と、別アプリで入力検証や学習の説明を作り直す負担が対象。ただし開発時間短縮も未測定。',
      ],
      [
        'STEP 1 · 入力',
        '環境と刺激をTXに記録する',
        [
          '初期TX：寸法・seed・危険エリアを設定',
          '刺激TX：確定した正の入力で餌を1個追加',
          '画面で初期環境と餌の元TXを開ける',
        ],
        'ハエへの外部入力はすべてオンチェーンデータです。',
        '所有者が初期環境を設定する。Workersは毎時確認し、最低1時間間隔でAgent #1への刺激を送る。1分では既存TXを示す。登録・刺激0・重複・失敗TXは餌を増やさない。',
      ],
      [
        'STEP 2 · 判断',
        '確認した環境から、移動と休息を選ぶ',
        [
          'TXとイベントを確認して環境へ反映',
          '環境＋内部の身体状態を感覚入力へ変換',
          '実測7神経・19接続 → 行動選択 → 結果',
        ],
        '感覚変換・身体・判断・描画はオフチェーンの計算です。',
        '接続は実測由来だが動力学と感覚・行動変換は人工設計。餌は消費すると消え、未記録の補充はない。クリックは個体選択で、餌の追加ではない。',
      ],
      [
        'STEP 3 · 学習',
        '経験を再生し、候補と今の方策を比べる',
        [
          '個体を選び「学習室へ」',
          '確認済み環境のコピー＋経験でQ値を更新',
          '比較スコアが改善：採用 ／ 改善なし：維持',
        ],
        'これは同じ環境の再生比較。未知環境での効果とは分けます。',
        '神経接続は固定。学習用コピーは本番の餌を増やさない。復帰時の体力回復を学習効果と呼ばない。全神経の市場動画は別のreadoutオンライン更新で、同じ採用ゲートではない。',
      ],
      [
        'STEP 4 · 証拠',
        '動作の証拠と、改善効果を分ける',
        [
          '公開版：定期TXで餌が3 → 4へ増えることを確認',
          '動画：全神経4個体、Aqua 1件・V3 11件の決済',
          '別研究：報酬18.79 → 56.12、直接入力対照56.08',
        ],
        '接続・学習は動いた。生物回路の性能優位は未確認です。',
        '数値は保存済み検証の結果。公開版の学習成績ではない。採餌研究は5探索seed・各条件60未使用環境で、終了時エネルギーも悪化。撮り直した動画は現行の環境TX仕様に対応。全神経の採餌readoutと公開版のQ学習は別実装。',
      ],
      [
        'STEP 5 · 次の検証',
        '低負荷で役立つ判断にできるかを測る',
        [
          '同じ入力・同じ仕事で、小型AIと比較',
          '報酬・失敗率・適応時間・RAM・J/判断を測る',
          'Uniswap：実行／見送り、Aqua：提示／撤回へ応用',
        ],
        '低コスト化 → 導入・継続利用増加は、検証したい価値の仮説です。',
        '現在の市場実装は独自FlyV3RouterとV3 core。Universal Router／Trading APIは未使用。直接の削減先はAgent運用者。利用者増加、プロトコルの利益、電力削減は未測定。',
      ],
    ],
  },
  en: {
    title: 'BioAgent | From purpose to demo',
    goalTitle: 'What we want to achieve',
    goal: 'Build a framework for running biologically derived decision models on onchain inputs, adapting from experience, and comparing their effectiveness and resource use.',
    value:
      'For agent developers and researchers: reuse input validation, model provenance and learning records to discover when biological circuits are useful.',
    stepsTitle: 'Explain the public demo in this order',
    steps: [
      [
        '1 | Open',
        'Open Sepolia without a wallet and select the three agents. “Decisions use seven measured neurons and 19 connections.”',
      ],
      [
        '2 | Trace the environment',
        'Open “Environment and food input TXs” and its initial TX. “Dimensions and hazards were recorded in this transaction.”',
      ],
      [
        '3 | Follow stimulus to action',
        'Show a food source TX and behavior. “One confirmed positive stimulus adds one food; the model uses encoded observations to choose movement or rest.”',
      ],
      [
        '4 | Inspect learning',
        'Select an agent and press “Start learning”. “It updates Q-values using experience and a copy of the confirmed environment, adopting only a higher-scoring candidate.”',
      ],
      [
        '5 | Read the result',
        'Show before/candidate and adopt/keep. “This compares replays of the same environment. We study unseen-world effects in a separate controlled experiment.”',
      ],
    ],
    caution:
      'The sender checks hourly, with at least one hour between sends. Use recorded TXs for a one-minute presentation. Manual writes require the owner. Once food is eaten, agents rest; there is no refill. No improvement is a valid result.',
    scopeTitle: 'Use the three evidence tracks correctly',
    scope: [
      ['Current public page', 'Sepolia, 7 neurons, 3 agents: TX inputs, foraging and Q-learning.'],
      [
        'Submitted video',
        'Anvil, 166,700 neurons per agent: two-agent environment TX and learning comparison, then four-agent Aqua/V3 settlement.',
      ],
      [
        'Independent research',
        'Synthetic foraging controls: reward improved, but a biological advantage was not established.',
      ],
    ],
    pitchTitle: 'A roughly one-minute script',
    pitch:
      'We are building a framework for using biological decision models in applications and testing whether learning helps. First, we record the environment, including hazards, in a transaction. A confirmed stimulus then adds food, and the agent chooses movement or rest. Learning replays that environment and experience, adopting an improved candidate. The demo lets us trace inputs, decisions and learning. A separate controlled experiment improved reward, but did not establish a biological advantage. Next, we will compare the same task against small AI models, measuring adaptation speed and resource use.',
    slides: [
      [
        'PURPOSE',
        'Make biological decision models usable and testable',
        [
          'For agent developers and researchers',
          'Aim: economical repeated decisions and adaptation',
          'Built: traceable inputs, models and learning results',
        ],
        'Lower power and an advantage over ordinary AI remain hypotheses.',
        'Lead with the intended improvement: the cost of routine decisions and repeated integration work. Reuse input validation and model/learning descriptions. Developer-time savings have not been measured.',
      ],
      [
        'STEP 1 · INPUT',
        'Record the environment and stimuli in TXs',
        [
          'Initial TX: dimensions, seed and hazards',
          'Stimulus TX: one confirmed positive input adds one food',
          'Open the environment and food source TXs on screen',
        ],
        'All external inputs to the flies come from onchain data.',
        'The owner initializes the environment. Workers checks hourly and sends to Agent #1 at least one hour apart. Show recorded TXs within a minute. Registration, zero stimulus, duplicates and failed TXs add no food.',
      ],
      [
        'STEP 2 · DECISION',
        'Turn the confirmed world into movement or rest',
        [
          'Verify TXs and events before applying inputs',
          'Encode the environment and internal body state',
          '7 measured neurons, 19 connections → action → outcome',
        ],
        'Encoding, body state, decisions and rendering run offchain.',
        'Measured wiring supplies the topology; dynamics and sensory/motor mappings are engineered. Consumed food disappears. Clicking selects an agent; it does not create food.',
      ],
      [
        'STEP 3 · LEARNING',
        'Replay experience and compare the candidate',
        [
          'Select an agent and “Start learning”',
          'Update Q-values from a confirmed-world copy and experience',
          'Higher comparison score: adopt / Otherwise: keep',
        ],
        'Same-environment replay is separate from unseen-world testing.',
        'The wiring stays fixed. Training copies never add visible food. Recovery on returning from training is not a learned improvement. The full-market video uses separate online readout updates, without this adoption gate.',
      ],
      [
        'STEP 4 · EVIDENCE',
        'Separate working integration from improved behavior',
        [
          'Public: a scheduled TX increased food from 3 to 4',
          'Video: four full agents, 1 Aqua and 11 V3 settlements',
          'Research: reward 18.79 → 56.12; direct-input control 56.08',
        ],
        'Integration and learning work; biological superiority is unproven.',
        'These are saved observations from three different tracks. Research used five search seeds and 60 unseen worlds per profile; final body energy also fell. The new recording includes current environment TXs. Full-foraging readouts are separate from public Q-learning.',
      ],
      [
        'STEP 5 · NEXT TEST',
        'Measure useful decisions within a small budget',
        [
          'Compare small AI models on the same inputs and task',
          'Measure reward, failures, adaptation, RAM and joules/action',
          'Apply to Uniswap execute/hold and Aqua offer/withdraw',
        ],
        'Lower operating cost could encourage adoption; that is unmeasured.',
        'The current market uses custom FlyV3Router and V3 core, not Universal Router or Trading API. Savings would accrue to agent operators. User growth, protocol revenue and energy savings have not been measured.',
      ],
    ],
  },
};

export function walkthroughFor(capture) {
  const d = structuredClone(base);
  d.ja.slides[4][2][1] = `動画：全神経4個体、Aqua ${capture.newRoutes.Aqua}件・V3 ${capture.newRoutes['Uniswap V3']}件の決済`;
  d.en.slides[4][2][1] = `Video: four full agents, ${capture.newRoutes.Aqua} Aqua and ${capture.newRoutes['Uniswap V3']} V3 settlements`;
  return d;
}
