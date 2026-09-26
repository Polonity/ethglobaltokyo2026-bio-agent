export const comparisonSources = [
  ['R7', 'Comparison rationale, measurements and protocol', 'ai-agent-comparison.md'],
  ['S1', 'HF: weight quantization', 'https://huggingface.co/docs/transformers/main/en/quantization/overview'],
  ['S2', 'HF: KV cache and generation', 'https://huggingface.co/docs/transformers/main/en/kv_cache'],
  ['S3', 'MLCommons: whole-system power', 'https://mlcommons.org/benchmarks/inference-edge/'],
  ['S4', 'ESN primary paper, §2.1', 'https://www.ai.rug.nl/minds/uploads/techreport2.pdf'],
  ['S5', 'HF: hosted inference', 'https://huggingface.co/docs/inference-providers/index'],
];

export function recordedResources(settlement) {
  const summarize = (key) => {
    const values = settlement.cycles.map((c) => c.metrics[key]).sort((a, b) => a - b);
    const n = values.length;
    return {
      samples: n,
      min: values[0],
      median: n % 2 ? values[(n - 1) / 2] : (values[n / 2 - 1] + values[n / 2]) / 2,
      max: values.at(-1),
    };
  };
  return {
    neuralMs: summarize('neuralMs'),
    cycleMs: summarize('cycleMs'),
    peakRSSMiB: Math.max(...settlement.cycles.map((c) => c.metrics.peakRSSMiB)),
  };
}

export function comparison(settlement, resources) {
  const readout = resources.readout.coefficients;
  const r = recordedResources(settlement);
  const neuralRange = `${r.neuralMs.min.toFixed(0)}–${r.neuralMs.max.toFixed(0)}`;
  const cycleRange = `${(r.cycleMs.min / 1000).toFixed(2)}–${(r.cycleMs.max / 1000).toFixed(2)}`;
  const rss = r.peakRSSMiB.toFixed(1);
  return {
    ja: {
      title: 'AI Agent比較：期待する効果',
      subtitle: '対象は、数値入力から少数の行動を繰り返し選ぶ処理。汎用的な言語能力との比較ではありません。',
      pitch:
        '狙いは、定型的な判断を小さい計算予算で継続することです。固定回路と小さなreadoutで、メモリー・計算時間・更新負荷を抑える可能性を調べています。低電力・低コスト・低遅延は期待する効果で、比較優位の実証はこれからです。',
      headings: ['比較軸', '期待する効果と理由（仮説）', '実測・制約'],
      rows: [
        [
          '電力・費用',
          'CPU上の限られた計算で済めば、常時動作の電力や推論API費用を減らせる可能性。',
          '節約先はAgent実行側。電力・費用は未測定で、ガス代・RPC等は別。',
        ],
        [
          'メモリー',
          '固定の疎なグラフを個体間で共有し、個別状態と行動readoutを保持。',
          `${rss} MiBは4個体を動かすPythonプロセスのpeak RSS。PC全体のRAMや組込機器での実績ではない。`,
        ],
        [
          '反応速度',
          '4stepの回路処理から行動へ進むため、毎回の文章生成や外部推論APIの往復を省ける。',
          `収録${r.neuralMs.samples}周期で神経処理は4個体合計${neuralRange} ms。実行期限の保証ではない。`,
        ],
        [
          '適応・更新',
          `固定回路は維持し、readoutの${readout}係数／個体だけを再適合できる。`,
          '柔軟性は対象課題の範囲内。小型AIも可能。LLMも文脈・指示から適応でき、重み更新が必須ではない。',
        ],
      ],
      questions: [
        [
          'LLMは256 GB必要だから、圧倒的に小さい？',
          '必要量はモデル・精度・文脈で変わります。',
          '8Bモデルの重みだけならFP16で約16 GB、4bitで理論上約4 GB（十進）。KV cache等は別です。API利用側はモデルを載せません。同等の能力・仕事を揃えて比較します。',
          'S1, S2, S5',
        ],
        [
          '電気代は何分の一になる？',
          '倍率は未測定です。RAMから消費電力は換算できません。',
          '同じ品質・判断数で機器全体のWとJ/判断を測ります。料金試算は平均W×稼働時間÷1,000×単価。API費・設備費・学習費も別に合算します。',
          'S3, R7',
        ],
        [
          '333 msなら取引もその速さで終わる？',
          '神経処理の時間と、取引成立までの時間は別です。',
          `4個体の神経計算＋特徴抽出は${neuralRange} ms。RPC・ローカル取引等を含む周期は${cycleRange}秒、ループは約4秒間隔。1個体の応答時間や公開チェーンの確定時間ではありません。`,
          'R1, R7',
        ],
        [
          '普通の小型AIやreservoirでよいのでは？',
          '有力な対照です。軽量化だけでは生物固有の価値になりません。',
          '固定回路＋学習readoutは既存研究にもあります。生物接続が時間的な判断へ役立つかを、ランダム回路・小型モデルと比較します。7神経の採餌実験では直接入力対照への優位は未確認です。',
          'R3, S4',
        ],
        [
          '何を揃えれば、公平な比較になる？',
          '入力・行動・品質・頻度・測定範囲を揃えます。',
          '固定ルール、小型MLP/RNN、LLM、BioAgentを未使用データで比較。行動が使えるまでのp50/p95、失敗率、RAM、J/判断を測ります。LLMで計画し小型モデルで実行する分業も今後の候補です。',
          'R7',
        ],
      ],
      footer: '期待効果と実測を分ける。AI AgentはLLMに限らない。出典・比較条件はR7。',
    },
    en: {
      title: 'AI agent comparison: expected benefits',
      subtitle:
        'Scope: repeated choices among a few actions from numeric inputs, not equivalent general language ability.',
      pitch:
        'We aim to keep routine decisions running within a small compute budget. A fixed circuit and a small readout may reduce memory, processing and update costs. Lower energy use, cost and latency are hypotheses; a matched comparison must establish the benefit.',
      headings: ['Dimension', 'Expected benefit and mechanism', 'Evidence and limits'],
      rows: [
        [
          'Energy / cost',
          'Bounded CPU work could lower always-on energy use or repeated inference-API charges.',
          'Savings would accrue to agent operators. Power/cost are unmeasured; gas and RPC costs remain.',
        ],
        [
          'Memory',
          'Share one fixed sparse graph across individuals; keep separate states and readouts.',
          `${rss} MiB is peak RSS of the four-agent Python process, not whole-system RAM or proof of microcontroller deployment.`,
        ],
        [
          'Latency',
          'Four circuit steps can lead to an action without generating text or calling an external inference API.',
          `Four-agent neural processing: ${neuralRange} ms in ${r.neuralMs.samples} recorded cycles. This is not a real-time guarantee.`,
        ],
        [
          'Adaptation',
          `Refit only ${readout} readout coefficients per agent; keep the circuit fixed.`,
          'Task-specific flexibility. Small conventional models can do this too; LLMs can adapt via context without retraining.',
        ],
      ],
      questions: [
        [
          'Does every LLM need 256 GB?',
          'No: model size, precision and context determine memory.',
          'For an 8B model, weights alone are about 16 GB at FP16 or an ideal 4 GB at 4-bit (decimal). KV cache and overhead are extra. API clients do not host those weights. Compare equivalent tasks.',
          'S1, S2, S5',
        ],
        [
          'How much electricity does it save?',
          'We have no measured savings ratio; RAM does not determine watts.',
          'Measure system power and joules per decision at matched quality and workload. Electricity cost = average W × operating hours / 1,000 × tariff. Add API, hardware and training costs separately.',
          'S3, R7',
        ],
        [
          'Does 333 ms mean a completed trade?',
          'Neural processing and settlement latency are different.',
          `Four-agent neural computation plus features took ${neuralRange} ms; cycles including local transactions/RPC took ${cycleRange} s. The loop targets roughly 4 s. These are neither single-agent response times nor public-chain finality.`,
          'R1, R7',
        ],
        [
          'Why not a small AI model or a reservoir?',
          'They are essential controls; efficiency alone is not uniquely biological.',
          'Fixed circuits with learned readouts already exist. We must compare biological wiring against random circuits and small models for temporal decisions. The seven-neuron foraging experiment did not establish an advantage over direct inputs.',
          'R3, S4',
        ],
        [
          'What makes the comparison fair?',
          'Match inputs, actions, quality, request rate and measurement scope.',
          'Compare rules, small MLP/RNNs, LLMs and BioAgent on unseen data. Measure usable-action p50/p95, failures, RAM and joules/decision. LLM planning plus a small action controller is another future option.',
          'R7',
        ],
      ],
      footer:
        'Distinguish hypotheses from measurements. AI agents are not limited to LLMs. R7 contains the protocol.',
    },
  };
}
