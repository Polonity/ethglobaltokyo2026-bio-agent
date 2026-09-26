// Shared by in-page help, printable sheets and generated documentation.
const t = (ja, en) => ({ ja, en });
const row = (ja, en, jd, ed) => [t(ja, en), t(jd, ed)];
const common = {
  title: t('このアプリの見方', 'How to read this app'),
  sheet: t('説明シートを開く・印刷', 'Open / print the app sheet'),
  more: t('状態・吹き出し・数値の意味', 'States, bubbles and numbers'),
  flowTitle: t('チェーンから行動まで', 'From chain to action'),
  traceTitle: t('直近の動作をたどる', 'Trace the latest action'),
  idle: t(
    '実行すると、入力の出典 → 神経計算 → 行動 → 結果をここで確認できます。',
    'Run the app to trace the input source → neural computation → action → outcome here.',
  ),
  biology: t(
    'MaleCNSは実測された神経接続の地図です。入力を神経に割り当てる方法、活動の計算式、身体、行動への変換はこの実験の人工モデルです。吹き出しから本物のハエの感情や思考を読み取れるわけではありません。',
    'MaleCNS provides measured neural connectivity. Input mapping, activity dynamics, body state and action decoding are engineered for this experiment. Bubbles do not reveal a real fly’s emotions or thoughts.',
  ),
  fullModel: t(
    '全神経モードは分類付き166,700神経・25,582,938内部接続を個体ごとに計算します。16入力を感覚神経集団に与え、4神経step後の活動集計をreadout（行動に変換する学習器）へ渡します。7神経モードも明示的に選択できます。',
    'Full mode computes 166,700 classified neurons and 25,582,938 internal connections per individual. Sixteen inputs drive sensory populations; after four neural steps, activity summaries feed a learned action readout. A seven-neuron mode is an explicit alternative.',
  ),
  browserModel: t(
    '従来のブラウザー版は実測MaleCNSの7神経・19接続を使います。32stepの回路応答を行動変換へ渡します。全神経版とは入力変換や学習方法が異なります。',
    'The original browser apps use seven measured MaleCNS neurons and 19 connections. Their 32-step circuit response feeds action decoding. Input mapping and learning differ from the full-population apps.',
  ),
  learning: t(
    '収集＝実際に動かして観測・行動・結果を保存。学習＝保存した神経特徴と報酬からreadoutを更新。評価＝別の実行で旧方策と候補を比較。改善した個体だけ採用し、v2などの方策番号が次の判断へ反映されます。神経接続そのものは固定です。',
    'Collect: save real action observations and outcomes. Train: fit the readout from saved neural features and rewards. Evaluate: compare the current policy and candidate in another run. Only improved individuals adopt the new version for subsequent decisions. Neural connections remain fixed.',
  ),
  phase: t(
    '「評価中」は候補を試している途中で、まだ採用を意味しません。「完了」はその実行の終了、「停止」はユーザーの操作による中断です。？はreadoutを学習している間の表示で、短時間の学習では見えないこともあります。',
    'Evaluating means a candidate is being tested, not yet adopted. Complete means the run ended; Stopped means the user interrupted it. A ? indicates readout training and may be too brief to see when fitting finishes quickly.',
  ),
  boundary: t(
    'チェーンは入力や取引の出典を追うためのものです。神経計算・身体更新・学習はローカルで実行します。TX成功は、判断の正しさや利益を保証する印ではありません。',
    'The chain lets you trace inputs and transactions. Neural computation, body updates and learning run locally. A successful transaction does not certify a correct decision or a profitable policy.',
  ),
  numbers: [
    row(
      'Policy v / 方策番号',
      'Policy v / version',
      'その判断に使った行動変換の版。神経数や年齢ではありません。',
      'The action readout version used for this decision, not neuron count or age.',
    ),
    row(
      '神経step / ms',
      'Neural step / ms',
      '人工モデルの更新回数と神経計算時間。生物学的な時間や画面のFPSとは異なります。',
      'Artificial model updates and neural computation time, not biological time or display FPS.',
    ),
    row(
      '学習前 / 候補 / 別条件',
      'Before / Candidate / New test',
      '旧方策の評価、候補の評価、採用後の別入力での結果。各欄はMOMO / SORA順。数値はその実行の累積報酬です。',
      'Current-policy evaluation, candidate evaluation, and a new-input run after adoption. Values are MOMO / SORA cumulative rewards for each run.',
    ),
    row(
      'TX / Block / hash',
      'TX / Block / hash',
      '入力や取引が記録されたトランザクションとブロック。Anvilではローカルreceiptを開きます。ハエの全神経状態がチェーンに保存されるわけではありません。',
      'The transaction and block recording an input or trade. Anvil links open local receipts. The fly’s full neural state is not stored onchain.',
    ),
  ],
};
const apps = {
  foraging: {
    name: t('01 採餌 — オンチェーン刺激の箱庭', '01 Foraging — an onchain stimulus playground'),
    goal: t(
      '蜜を集め、危険を避け、疲れたら休む。刺激と身体の状態が次の一歩をどう変えるかを観察します。',
      'Collect nectar, avoid hazards, and rest. Observe how recorded stimuli and body state affect the next step.',
    ),
    legend: [
      row(
        '黄色い粒＝蜜',
        'Yellow dots = nectar',
        'ローカルで生成するゲーム内の食べ物。近づいて取ると得点・満腹度・活動エネルギーが増え、蜜は別の場所に現れます。トークンやNFTではありません。',
        'Locally generated food. Collecting it increases food score, fullness and activity energy, then relocates it. It is not a token or NFT.',
      ),
      row(
        '薄いオレンジの円＝危険地帯',
        'Peach circles = hazards',
        '入ると減点とエネルギー消費。オンチェーンの刺激が強いほど衝突の罰が大きくなります。',
        'Entering costs reward and energy. Stronger onchain stimulus increases the collision penalty.',
      ),
      row(
        'ハエ＝独立した個体',
        'Flies = separate individuals',
        'それぞれ身体状態と方策を持ちます。同じ蜜を取り合うため、同じ刺激でも経験や判断は一致しません。',
        'Each has its own body state and policy. Shared food creates competition, so identical stimuli need not produce identical experiences or decisions.',
      ),
    ],
    flow: [
      row(
        '1 刺激を記録',
        '1 Record a stimulus',
        'スライダー → BioAgentStatusUpdatedのTX。全神経版の通常実行では0〜1を0〜10000として登録し、確認した値を入力へ戻します。',
        'Slider → a BioAgentStatusUpdated transaction. A normal full-app run records 0–1 as 0–10,000 and reads the confirmed value back into the input.',
      ),
      row(
        '2 観測を入力へ',
        '2 Encode the scene',
        '蜜の方向・距離、周囲の危険、エネルギー、満腹度、蓄え、刺激を人工的に数値化します。刺激を上げると移動入力が弱まり、危険の罰が増えます。「必ず右へ」などの命令ではありません。',
        'Engineered inputs encode nectar direction/distance, hazards, energy, fullness, reserves and stimulus. Higher stimulus attenuates movement drives and increases hazard cost; it is not a command such as “turn right”.',
      ),
      row(
        '3 回路から行動へ',
        '3 Circuit to action',
        'MaleCNSの活動 → readout → 8方向の移動または休息。全神経版ではエネルギーが0.08未満なら休息だけを許すルールもあります。',
        'MaleCNS activity → readout → one of eight movement directions or rest. Full mode also allows only rest when energy falls below 0.08.',
      ),
      row(
        '4 結果から学ぶ',
        '4 Learn from outcomes',
        '蜜の獲得、接近、衝突、休息の結果から報酬を計算し、次の学習に使います。描画と身体更新はオフチェーンです。',
        'Nectar collection, approach, collisions and rest produce rewards for learning. Rendering and body updates are offchain.',
      ),
    ],
    body: t(
      'Energyは動くための活動エネルギーで、移動で減り、休息や採餌で回復。満腹度は最近食べた量の指標で、採餌で増え、時間とともに減ります。蓄えは消化と消費でゆっくり変わり、体格の目標値になります。これらは人工的な身体モデルで、次の神経入力にも入ります。',
      'Energy supports activity: movement consumes it, while rest and feeding replenish it. Fullness tracks recent feeding and declines over time. Reserves change more slowly through digestion and expenditure and determine target body size. These synthetic body states also feed subsequent neural inputs.',
    ),
    bubbles: t(
      '全神経版のカードは「使用した方策」と「選んだ行動」の説明です。ハエの上の？はreadout学習中。従来版の♡＝蜜を獲得、！＝危険、すやすや＝休息、おなかいっぱい／ぐぅ＝満腹度の閾値による表示です。感情を計測したものではなく、処理結果を人が読める表現に変えています。',
      'Full-app cards show the policy used and action chosen; a ? over the fly denotes readout training. In the original app, ♡ means nectar collected, ! means hazard, sleeping means rest, and full/hungry captions come from fullness thresholds. These are readable labels for state and outcomes, not measured emotions.',
    ),
    metrics: [
      row(
        '蜜の数 / Score',
        'Nectar count / Score',
        '集めた蜜の個数。Rewardとは別です。',
        'Number of nectar items collected; different from Reward.',
      ),
      row(
        'Reward / 報酬',
        'Reward',
        '接近による小さな加点、蜜の獲得、危険による減点などの累積。蜜は満腹時ほど加点が小さくなります。',
        'Cumulative approach, food and hazard rewards/costs. Collecting food earns less reward when already full.',
      ),
    ],
    tryIt: t(
      '①全神経を選ぶ → ②刺激を変えて「現在の方策で動かす」 → ③蜜の数・身体状態・TXを確認 → ④「収集→学習→評価」で採用前後を見る。学習ボタンは比較用の固定条件を使い、スライダー変更は通常実行へ反映します。',
      '1 Choose Full mode. 2 Change stimulus and run the current policy. 3 Inspect food count, body state and TX. 4 Collect → learn → evaluate to compare policies. Training uses fixed evaluation conditions; the slider affects normal runs.',
    ),
    browser: {
      flowStart: t(
        '刺激を送信すると個体のStatusがチェーンに記録され、そのログを受けた個体の入力に反映します。ローカルだけの蜜や障害物はチェーンに記録しません。',
        'Submitting a stimulus records the individual’s Status; its event updates that individual’s input. Local food and hazards are not stored onchain.',
      ),
      learning: t(
        '従来版は経験からQ値を更新し、別の採餌評価で改善した個体を復帰させます。？の個体はその場で停止して学び直します。全神経版の共通readout学習とは別の実装です。',
        'The original app updates Q values from experience and returns improved individuals after a separate foraging evaluation. A ? fly pauses in place to learn. This differs from the full-app shared readout learner.',
      ),
      tryIt: t(
        '刺激送信と、蜜を置く操作を比べてみてください。前者はTXの証拠があり、後者はローカルの環境変更です。個体を選ぶと状態・判断・学習の詳細を追えます。',
        'Compare submitting a stimulus with placing food: the first has a TX witness; the second changes the local environment. Select an individual to inspect its state, decisions and learning.',
      ),
    },
  },
  market: {
    name: t(
      '02 市場 — 値動きに反応するペーパートレード',
      '02 Market — paper trading in response to price changes',
    ),
    goal: t(
      '価格の変化を刺激にして、待機・買い・売りを選ぶ。取引の結果から学び、仮想資産の損益を比べます。',
      'Use price changes as stimuli to hold, buy or sell. Learn from outcomes and compare paper portfolio returns.',
    ),
    legend: [
      row(
        '折れ線＝観測した価格',
        'Line = observed price',
        '全神経版はAnvil上の実Uniswap V3 Swap履歴を再生。token1 / token0の価格で、画面の線は取得したサンプルの相対表示です。未来の予測線ではありません。',
        'Full mode replays actual Uniswap V3 Swap history from Anvil. Price is token1 per token0; the line shows sampled observations on a relative scale, not a forecast.',
      ),
      row(
        'ハエ＝ペーパー口座',
        'Flies = paper accounts',
        '各個体は仮想現金と保有量を持ちます。上下に揺れる見た目は演出で、注文サイズや神経活動量ではありません。',
        'Each individual holds virtual cash and a position. Visual bobbing is decorative, not order size or neural activity.',
      ),
    ],
    flow: [
      row(
        '1 Swapを観測',
        '1 Observe Swap',
        '実プールの確認済みログとblockHashを読みます。全神経版は保存した履歴の再生であり、外部市場のリアルタイム配信ではありません。',
        'Read confirmed pool logs and block hashes. The full app replays recorded history; it is not a live external market feed.',
      ),
      row(
        '2 値動きと身体',
        '2 Price changes and body',
        '上昇・下落・変動幅、保有の有無、現金、満腹度、蓄えを入力へ変換します。',
        'Encode up/down movement, magnitude, position, cash, fullness and reserves.',
      ),
      row(
        '3 回路が売買を選ぶ',
        '3 Circuit chooses a trade',
        '神経活動をreadoutへ渡し、待機・買い・売りを選択。保有していなければ売れず、保有中は追加買いをしないルールです。',
        'Neural activity feeds a readout that chooses hold/buy/sell. The rules prohibit selling without a position and additional buying while already holding.',
      ),
      row(
        '4 後の価格で評価',
        '4 Evaluate at a later price',
        '全神経版は次の観測ブロックでquoteし、その次で値洗い。手数料・価格影響を含む評価額の差を報酬として記録します。',
        'Full mode quotes at the next observed block and values at the following one. Changes in liquidation equity, including pool fees and price impact, become rewards.',
      ),
    ],
    body: t(
      '食べ物を集める代わりに、正の報酬を「食べた」という人工的な身体入力へ写します。満腹度・蓄えは次の判断へ戻ります。全神経版のEnergyは現在0.7固定で、利益や勝率を示すゲージではありません。',
      'Instead of collecting food, positive reward is mapped to synthetic feeding. Fullness and reserves affect subsequent decisions. Energy is currently fixed at 0.7 in the full app; it is not profit or confidence.',
    ),
    bubbles: t(
      '待機＝何もしない、買い＝ペーパー保有を作る、売り＝ペーパー保有を閉じる、？＝学習。学習中でも保有価格のリスクが消えるわけではありません。表示は選択した行動の要約で、ハエが市場を理解したという証拠ではありません。',
      'Hold means no trade, buy opens a paper position, sell closes it, and ? means learning. Learning does not eliminate existing position risk. These labels summarize actions, not evidence that the fly understands markets.',
    ),
    metrics: [
      row(
        'PnL / 損益',
        'PnL',
        '初期100 token1に対する仮想資産の増減。保有は売却quoteで値洗いします。実ウォレットの利益ではありません。',
        'Paper equity minus the initial 100 token1. Positions are marked using liquidation quotes. This is not actual wallet profit.',
      ),
      row(
        'Reward / 報酬',
        'Reward',
        'その判断による評価額の変化。累積するとその実行のPnLになります。ガスは取引ごと0.001 token1という仮定です。',
        'Change in equity per decision, summing to run PnL. Gas is an explicit assumption of 0.001 token1 per trade.',
      ),
      row(
        '入力TXと注文',
        'Input TX versus order',
        'TXリンクは主に価格の出典となるSwapです。ハエの売買はペーパーなので、売買ボタンに対応する実資産の注文TXではありません。',
        'The linked TX primarily witnesses the source Swap price. Fly trades are paper trades, not asset-moving order transactions.',
      ),
    ],
    tryIt: t(
      '価格の線 → 行動名 → PnL → 元のSwap TXの順に見てください。次に学習を実行し、候補の改善と別条件の結果を分けて確認します。',
      'Follow price line → action label → PnL → source Swap TX. Then train and distinguish candidate improvement from results on new inputs.',
    ),
    browser: {
      learning: t(
        '従来版は実Swapログを受け、後のブロックのquoteで仮想約定します。報酬予測の誤差が減った候補を採用するため、採用がPnL改善を意味するとは限りません。',
        'The original app consumes real Swap logs and fills virtually using later-block quotes. Adoption is based on reduced reward-prediction error, which does not necessarily improve PnL.',
      ),
      tryIt: t(
        '「価格を上げる／下げる」でテストプールを動かし、Swap TX・入力・ハエの注文・後の約定を追ってください。',
        'Move the test pool with the price up/down controls and follow Swap TX → input → fly order → later fill.',
      ),
    },
  },
  aqua: {
    name: t('03 Aqua — 共有流動性を出す・引く', '03 Aqua — offer or withdraw shared liquidity'),
    goal: t(
      '市場の変化を受けて、狭い提示・広い提示・撤回を選ぶ。ウォレットにあるテスト資金をAquaの戦略で使います。',
      'Respond to market changes with a tight quote, a wide quote or withdrawal, using test funds held in a wallet through Aqua strategies.',
    ),
    legend: [
      row(
        '折れ線＝判断に使う価格履歴',
        'Line = price history used as input',
        '全神経版は実Uniswap履歴を再生し、変動の方向と大きさを使います。Aquaのテストトークン価格そのものを取得しているわけではありません。',
        'Full mode replays real Uniswap history and uses the direction and magnitude of changes. It is not fetching a market price for the Aqua test tokens themselves.',
      ),
      row(
        'ハエ＝流動性を制御する方策',
        'Flies = liquidity-control policies',
        '神経活動から戦略を選びます。共有ウォレットの仮想提示額を増やしても、実残高が増えるわけではありません。',
        'Neural activity selects a strategy. Increasing virtual allocations against a shared wallet does not create additional real balance.',
      ),
    ],
    flow: [
      row(
        '1 市場を刺激へ',
        '1 Market to stimulus',
        '全神経版は価格変動幅を0〜1に変換。判断後、Aqua操作に対応する刺激とStatus TXを記録します。',
        'Full mode maps price-change magnitude to 0–1. After the decision, it records the corresponding stimulus in a Status TX alongside the Aqua operation.',
      ),
      row(
        '2 回路とreadout',
        '2 Circuit and readout',
        '変動の方向・大きさ、満腹度、蓄え、手数料、直前の約定有無を神経入力にして行動を選びます。',
        'Direction/magnitude, fullness, reserves, fees and the previous fill become neural inputs for action selection.',
      ),
      row(
        '3 SDKで実操作',
        '3 Execute via the SDK',
        '全神経版は狭い提示30bps、広い提示800bps、撤回を選択。SDKのship/dockと、成立したテストトークン交換は実TXです。撤回もガスを使います。',
        'Full mode chooses a 30-bps tight quote, an 800-bps wide quote, or withdrawal. SDK ship/dock operations and accepted test-token fills are real transactions. Withdrawal also uses gas.',
      ),
      row(
        '4 実結果を評価',
        '4 Evaluate actual outcomes',
        '実約定の残高差を、次のUniswap価格を使った代理評価へ変換し、報酬として学習します。',
        'Actual fill balance changes are valued using a proxy based on the next Uniswap price and become learning rewards.',
      ),
    ],
    body: t(
      '正の代理報酬を人工的な摂食へ、撤回を休息へ対応づけています。満腹度と蓄えは次の入力に戻ります。全神経版のEnergyは0.7固定です。これは実際のハエが手数料を食べるという意味ではありません。',
      'Positive proxy reward maps to synthetic feeding and withdrawal to rest. Fullness and reserves feed the next input. Energy is fixed at 0.7 in full mode; the fly is not literally eating fees.',
    ),
    bubbles: t(
      '狭い提示＝取引を受け入れやすい設定、広い提示＝より広いスプレッド、撤回＝戦略を取り下げる判断。？は学習中の表示です。神経領域の名前から恐怖・欲望を読み出しているわけではありません。',
      'Tight quote offers a narrow spread; wide quote widens it; withdrawal removes the strategy. ? denotes training. These are action labels, not fear or desire decoded from named brain regions.',
    ),
    metrics: [
      row(
        'fees / 手数料',
        'fees',
        '実テスト約定の入力額と出力額の差の累計。次の価格による不利な評価はここに含まないため、Rewardとは一致しません。',
        'Cumulative input-minus-output amount in actual test fills. It excludes adverse valuation at the next price, so it differs from Reward.',
      ),
      row(
        'Reward / 代理報酬',
        'Reward / proxy reward',
        '残高差を次の価格比で評価した増分。ウォレット全体のPnL、実現利益、LVRの推定値ではありません。',
        'Incremental fill balance changes valued at the next price ratio. Not total-wallet PnL, realized profit or an LVR estimate.',
      ),
      row(
        'bps / 約定条件',
        'bps / fill condition',
        '100bps＝1%。この実験では広い提示は直近変動が200bps以上の場合だけ人工takerが受け入れます。実際の市場需要を推測したものではありません。',
        '100 bps = 1%. The experimental taker accepts wide quotes only when observed movement is at least 200 bps. This is a disclosed demand rule, not inferred market demand.',
      ),
    ],
    tryIt: t(
      '行動名とfeesを見ながら、TXリンクでStatus・戦略登録／撤回・約定を確認してください。学習後はfeesだけでなく代理報酬の変化も比較します。',
      'Watch actions and fees, then inspect Status, strategy ship/dock and fill TXs. After training, compare proxy reward as well as fees.',
    ),
    browser: {
      flowStart: t(
        '従来版はスライダーの人工的な危険刺激をStatusとして記録し、そのログからMaleCNSの応答を計算します。市場変動を自動入力する全神経版とは異なります。',
        'The original app records a slider-driven artificial risk stimulus as Status and computes the MaleCNS response from that event. Unlike full mode, it does not automatically use market movement as input.',
      ),
      learning: t(
        '従来版の学習は人工risk-target教材に回路応答のgainを合わせます。誤差が小さくなっても取引収益の改善を意味しません。表示された戦略を適用・約定する操作は別です。',
        'Original learning fits a response gain to a synthetic risk-target curriculum. Lower error does not demonstrate improved trading returns. Applying and filling the displayed strategy are separate operations.',
      ),
      body: t(
        '従来版の感度は個体ごとに設定されています。全神経版で使う満腹度・蓄えのフィードバックと混同しないでください。',
        'The original app assigns a sensitivity to each individual. This differs from the fullness/reserve feedback used by the full app.',
      ),
      metrics: [
        row(
          'response / 応答',
          'response',
          '実測7神経回路の人工的な活動指標。感度と学習したgainで戦略を変換します。広い／狭いの提示幅は全神経版の固定30/800bpsとは異なります。',
          'An artificial activity measure from the measured seven-neuron circuit. Sensitivity and learned gain map it to a strategy; spread selection differs from full mode’s fixed 30/800 bps.',
        ),
        row(
          'ship / dock / fill',
          'ship / dock / fill',
          '戦略の登録、撤回、テストトークンの実交換。表示された方策と、実際に適用済みの戦略をTXで区別します。',
          'Strategy registration, withdrawal, and actual test-token exchange. Use TXs to distinguish a displayed policy from an applied strategy.',
        ),
      ],
      tryIt: t(
        '刺激を送る → 回路応答を見る → 戦略を適用 → テスト約定の順に操作し、各段階のTXを確認します。',
        'Send stimulus → inspect circuit response → apply strategy → make a test fill, checking the TX at each stage.',
      ),
    },
  },
};
common.reducedModel = t(
  'この画面の比較モードは7神経・19接続のMaleCNS応答を使い、全神経モードと同じ環境・readout学習へ渡します。従来のブラウザー版のQ学習や人工教材とは別です。',
  'This comparison mode uses a seven-neuron, 19-edge MaleCNS response with the same environment and readout learner as full mode. It is distinct from the original browser Q learner and synthetic curriculum.',
);
apps.foraging.browser.flow = [
  [t('1 個体の刺激TX', '1 Individual stimulus TX'), apps.foraging.browser.flowStart],
  row(
    '2 身体と環境を観測',
    '2 Observe body and scene',
    '蜜の方向、危険、活動エネルギー、満腹度と刺激を回路への人工入力にします。',
    'Nectar direction, hazards, energy, fullness and stimulus become engineered circuit inputs.',
  ),
  row(
    '3 7神経の応答から動く',
    '3 Move from the seven-neuron response',
    '回路応答と学習したQ値から移動・休息を選び、ローカルの世界を更新します。',
    'Circuit responses and learned Q values select movement or rest and update the local world.',
  ),
  row(
    '4 行動経験を学習',
    '4 Learn action experience',
    '採餌と衝突などの結果を記録し、成績下位の個体が学び直して改善を評価します。',
    'Record feeding/collision outcomes; lower-ranking individuals retrain and are evaluated for improvement.',
  ),
];
apps.market.browser.legend = [
  row(
    'TOKEN 0 / TOKEN 1 / OBSERVE',
    'TOKEN 0 / TOKEN 1 / OBSERVE',
    '保有・現金・観察を示す舞台上の目印。黄色い蜜のような食べ物ではありません。移動するハエは保有や状態を可視化した演出です。',
    'Stage markers for holdings, cash and observation, not food. Fly movement is a visual representation of positions and state.',
  ),
  row(
    'PRICE / BLOCK',
    'PRICE / BLOCK',
    '実Swapに由来する観測価格とブロック。ハエの売買はペーパーです。',
    'Observed price and block from a real Swap. Fly trades remain paper trades.',
  ),
];
apps.market.browser.flow = [
  row(
    '1 実Swapを受け取る',
    '1 Receive a real Swap',
    '価格操作ボタンはテストプールで実Swapを起こし、確認済みログを入力にします。',
    'Price controls cause real swaps in the test pool; confirmed logs become inputs.',
  ),
  row(
    '2 値動きと身体を符号化',
    '2 Encode prices and body',
    '値動き、保有、満腹度を7神経回路の応答に変換します。',
    'Price changes, holdings and fullness are encoded through the seven-neuron circuit.',
  ),
  row(
    '3 仮想注文を選ぶ',
    '3 Select a paper order',
    'Q値などの行動変換から待機・買い・売りを選び、注文を保留します。',
    'The action policy selects hold/buy/sell and queues an order.',
  ),
  row(
    '4 後のブロックで約定',
    '4 Fill at a later block',
    '次のブロック以降のquoteで仮想約定と値洗いを行い、報酬予測を学びます。',
    'A later-block quote provides paper execution and valuation, feeding reward-prediction learning.',
  ),
];
apps.aqua.browser.goal = t(
  '人工的な危険刺激に対する回路応答を見て、Aquaの戦略を登録・撤回し、テスト約定を確かめます。',
  'Observe circuit responses to artificial risk, register or withdraw Aqua strategies, and inspect test fills.',
);
apps.aqua.browser.legend = [
  row(
    '神経図と応答メーター',
    'Circuit diagram and response meter',
    'MaleCNS部分回路の人工的な活動を表示。実際のハエの思考を読み取った図ではありません。',
    'Artificial activity in a measured MaleCNS subcircuit, not a recording of a fly’s thoughts.',
  ),
  row(
    '3匹のハエと戦略',
    'Three flies and strategies',
    '感度の異なる個体の出力。表示段階と、TXで実適用した段階を区別します。',
    'Outputs from individuals with different sensitivities. A displayed proposal differs from a strategy actually applied by TX.',
  ),
];
apps.aqua.browser.flow = [
  [t('1 刺激を記録', '1 Record stimulus'), apps.aqua.browser.flowStart],
  row(
    '2 応答を計算',
    '2 Compute response',
    '個体の感度で入力を調整し、7神経回路の応答と学習したgainを使います。',
    'Individual sensitivity adjusts the input; the seven-neuron response and learned gain determine output.',
  ),
  row(
    '3 戦略へ変換・適用',
    '3 Decode and apply strategy',
    '応答からship / cautious / dockと提示幅を計算。「適用」でAquaの実TXを送ります。',
    'Decode ship/cautious/dock and spread; Apply sends actual Aqua transactions.',
  ),
  row(
    '4 テスト約定を確認',
    '4 Inspect test fills',
    'テストトークンの交換とreceiptを確認。学習は別途、人工risk-target教材で実行します。',
    'Inspect test-token exchange and its receipt. Learning separately uses a synthetic risk-target curriculum.',
  ),
];
function localize(value, lang) {
  if (Array.isArray(value)) return value.map((v) => localize(v, lang));
  if (value && typeof value === 'object') {
    if ('ja' in value && 'en' in value) return value[lang];
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, localize(v, lang)]));
  }
  return value;
}
export function guideFor(app, lang = 'en', mode = 'full') {
  const a = localize(apps[app] || apps.foraging, lang),
    c = localize(common, lang);
  const override = mode === 'browser' ? a.browser : {};
  const flow = mode === 'browser' ? override.flow : a.flow;
  return {
    ...c,
    ...a,
    ...override,
    flow,
    model: mode === 'browser' ? c.browserModel : mode === 'reduced' ? c.reducedModel : c.fullModel,
    mode,
    app,
  };
}
