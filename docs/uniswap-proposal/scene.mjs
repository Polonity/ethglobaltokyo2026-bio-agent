import path from 'node:path';
import {b,slides,sources,questions,decisionFields} from './content.mjs';
export function makeScene(s,i,lang,{out,evidence,C}){
 const els=[],t=v=>typeof v==='object'?v[lang]:v;
 const rect=(x,y,w,h,fill=C.white,stroke)=>els.push({type:'rect',x,y,w,h,fill,stroke});
 const text=(v,x,y,w,h,size=18,color=C.ink,bold=false,extra={})=>{if(t(v))els.push({type:'text',text:t(v),x,y,w,h,size,color,bold,...extra});};
 const line=(x,y,x2,y2,color=C.line,width=1)=>els.push({type:'line',x,y,x2,y2,color,width});
 const label=(v,x,y,w=3,color=C.blue)=>text(v,x,y,w,.34,11,color,true);
 const small=(v,x,y,w=12,h=.4)=>text(v,x,y,w,h,11,C.muted);
 const arrow=(x,y,w=.3)=>text('→',x,y,w,.38,16,C.blue,true,{align:'center'});
 const note=(v,y=6.39,color=C.pale)=>{rect(.6,y,12.13,.49,color);text(v,.77,y+.1,11.78,.3,12,C.ink,true);};
 const tile=(x,y,w,h,head,body,color=C.blue,bs=15)=>{rect(x,y,w,h);rect(x,y,.045,h,color);text(head,x+.22,y+.19,w-.44,.72,lang==='ja'?18:17,color,true);text(body,x+.22,y+.99,w-.44,h-1.11,bs);};
 const table=(headers,rows,widths,{x=.6,y=2.26,rh=.75,font=14,headH=.48}={})=>{let yy=y;[headers,...rows].forEach((row,ri)=>{let xx=x;row.forEach((v,ci)=>{const h=ri?rh:headH;rect(xx,yy,widths[ci],h,ri?(ri%2?C.white:'F3EAF0'):C.ink);text(v,xx+.13,yy+.12,widths[ci]-.26,h-.19,ri?font:11,ri?C.ink:C.white,ri===0||ci===0);xx+=widths[ci];});yy+=ri?rh:headH;});};
 if(s.kind==='cover'){
  rect(0,0,13.333333,7.5,C.dark);rect(.62,.7,.62,.055,'E798BF');
  text(s.tag,.65,1,11.5,.35,12,'ECC0D7',true);
  text(s.title,.6,1.77,12.05,1.81,lang==='ja'?39:44,C.white,true);
  text(s.lead,.66,4.02,11.4,1.06,22,'EDE2EB');
  [b('実V3から観測','OBSERVE V3'),b('判断と学習を追跡','TRACE LEARNING'),b('同条件で比較','COMPARE')].forEach((v,j)=>{rect(.65+j*3.65,5.77,3.3,.65,j===2?C.teal:'513147');text(v,.86+j*3.65,5.95,2.87,.34,14,C.white,true);if(j<2)text('→',4.02+j*3.65,5.94,.26,.3,15,'ECC0D7');});
  text('2026.09.26 / '+(lang==='ja'?'日本語版':'ENGLISH EDITION'),.66,6.81,7,.3,11,'DDBDD2');text('DISCUSSION DRAFT',10.05,6.81,2.6,.3,11,'DDBDD2',true,{align:'right'});return els;
 }
 rect(0,0,13.333333,7.5,C.bg);rect(.6,.34,.45,.045,C.blue);label(s.tag,1.2,.25,11.5);
 const title=t(s.title);text(s.title,.6,.7,12.13,.66,lang==='ja'?(title.length>28?26:29):(title.length>67?25:28),C.ink,true);
 text(s.lead,.62,1.48,12.05,.66,lang==='ja'?15:14,C.muted);
 if(s.kind==='value'){
  const cards=[
   [b('1 / 観測の出典','1 / Trace the observation'),b('どのpool・Swap・blockを見たか。\n曖昧な価格列にせず、\n判断の出発点を追跡する。','Which pool, Swap and block?\nTrace the starting point of each decision to its recorded source.')],
   [b('2 / 学習の変化','2 / Inspect the learning'),b('どの経験から方策が変わったか。\n旧方策と候補を評価し、\n採用・不採用の理由を示す。','Which experience changed the policy?\nEvaluate old and candidate policies and show adoption or rejection.')],
   [b('3 / 比較できる結果','3 / Compare the outcomes'),b('同じ価格履歴・費用・時点で比較。\n全神経・軽量モデル・固定方策を\n検証できる形へ整理する。','Align history, costs and timing.\nPackage comparisons of full, small and fixed policies for inspection.')],
  ];cards.forEach(([h,bb],j)=>tile(.6+j*4.16,2.38,3.81,3.69,h,bb,[C.blue,C.teal,C.amber][j],15));note(b('価値の仮説：利益の大きさだけでなく、Agentの判断と評価を検証できること。','Value hypothesis: make agent decisions and evaluations inspectable, beyond a single return number.'));
 }
 if(s.kind==='requirements'){
  table([b('公式の対象・要件','Official scope / criterion'),b('現在地','Current status'),b('次の対応','Next action')],[
   [b('V3・周辺ツールも対象','V3 and ecosystem tooling included'),b('V3 poolとquoteを統合','V3 pool and quotes integrated'),b('評価ツールの価値を相談','Validate the tooling contribution')],
   [b('公開open-source code','Public open-source code'),b('GitHub公開 / root license未検出','Public GitHub / root license not detected'),b('対象コードのlicense表記を整理','Clarify licensing scope')],
   ['FEEDBACK.md',b('リポジトリ内に未作成','Not present in the repository'),b('実際の統合経験を記録','Document actual integration experience')],
   [b('Developer Feedback Form','Developer Feedback Form'),b('提出済みか未確認','Submission status unknown'),b('FEEDBACK.mdのリンクを含める','Submit with the FEEDBACK.md link')],
   [b('READMEから統合箇所を確認','README points to integration code'),b('案内はあるが新旧説明が混在','Pointers exist; old and current text coexist'),b('contract・コード行を明示','Point to contracts and exact code lines')],
  ],[3.64,4.35,4.14],{rh:.7,font:13.2});
  note(b('参加トラック・既存研究の扱い・適格性は未確認。v4 hook / Trading APIの利用は必須ではない。','Track, prior-work treatment and eligibility are pending. A v4 hook or Trading API call is not mandatory.'),6.5);
 }
 if(s.kind==='architecture'){
  label(b('市場データを作る実行 / ONCHAIN','MARKET-GENERATION EXECUTION / ONCHAIN'),.7,2.23,11);
  rect(.6,2.7,12.13,.62,C.ink);text(b('公式V3 factory / pool  →  test tokenの実Swap  →  receipt・blockHash・価格を保存','Official V3 factory / pool  →  actual test-token swap  →  recorded receipt, block hash and price'),.81,2.9,11.73,.35,14,C.white,true);
  const cards=[
   [b('観測を変換','Encode observations'),b('16本の人工入力\n価格・保有・身体など','16 engineered inputs\nPrice, position, body…')],
   [b('固定神経グラフ','Fixed neural graph'),b('166,700神経\n25,582,938接続','166,700 neurons\n25,582,938 edges')],
   [b('学習readout','Learned readout'),b('待機・買い・売り\n実験結果から更新','Hold, buy or sell\nLearn from outcomes')],
   [b('ペーパー評価','Paper evaluation'),b('後のblockでquote\n結果と方策を保存','Quote at later blocks\nSave outcome and policy')],
  ];cards.forEach(([h,bb],j)=>{tile(.6+j*3.1,3.89,2.83,2.12,h,bb,[C.blue,C.blue,C.teal,C.teal][j],13);if(j<3)arrow(3.44+j*3.1,4.8,.25);});
  note(b('Agentの注文はpoolを動かさない。実Swapを生成する処理と、Agentのペーパー評価を分ける。','Agent orders do not move the pool. Distinguish market-generating swaps from agent paper evaluation.'));
 }
 if(s.kind==='timing'){
  const cards=[
   [b('1 / 観測・判断','1 / Observe and decide'),b('記録ブロック D\n価格・保有・身体から\n待機 / 買い / 売りを選択','Recorded block D\nUse price, position and body\nto choose hold / buy / sell')],
   [b('2 / 仮想約定','2 / Paper fill'),b('後の記録ブロック F\n数量別のV3 quoteを取得\n台帳のcash / unitsを更新','Later recorded block F\nGet a size-specific V3 quote\nUpdate ledger cash / units')],
   [b('3 / 値洗い・報酬','3 / Value and reward'),b('さらに後のブロック M\n売却quoteで保有を評価\n資産価値の増減を保存','Still-later block M\nValue holdings with a sell quote\nRecord the equity change')],
  ];cards.forEach(([h,bb],j)=>{tile(.6+j*4.16,2.44,3.81,3.13,h,bb,[C.blue,C.teal,C.amber][j],17);if(j<2)arrow(4.43+j*4.16,3.85,.3);});
  text('D < F < M',.76,5.9,2.8,.43,22,C.blue,true);text(b('初期100 token1 / 買い10 token1 / ガス仮定0.001 token1 / 回','Initial: 100 token1 / Buy: 10 token1 / Assumed gas: 0.001 token1 per trade'),3.39,5.98,9.1,.42,14);
  note(b('quoteはpool手数料・価格影響を含む。Agent注文による将来のpool状態変化は再現しない。','Quotes include pool fees and price impact. Paper orders do not alter future pool states.'));
 }
 if(s.kind==='evidence'){
  rect(.6,2.29,7.19,4.47,C.white,C.line);els.push({type:'image',src:path.join(out,'assets/market-full-gui.png'),x:.63,y:2.32,w:7.13,h:4.41,crop:{x:124,y:360,w:1195,h:739}});
  const d=evidence.gui['market:full'];label(b('累積報酬 / ペーパー評価','CUMULATIVE REWARD / PAPER'),8.08,2.32,4.65);
  table(['',b('旧方策','Old'),b('候補','Candidate'),b('別条件','Later')],['MOMO','SORA'].map((n,j)=>[n,d.before[j].toFixed(3),d.after[j].toFixed(3),d.test[j].toFixed(3)]),[1.16,1.02,1.2,1.26],{x:8.08,y:2.82,rh:.53,font:11.5,headH:.45});
  text(b('MOMO：v1維持 / SORA：v2採用','MOMO kept v1 / SORA adopted v2'),8.11,4.57,4.57,.68,18,C.teal,true);
  text(b('SORAは別条件で −0.016。\n改善の持続や実利益は未実証。\n追加2区間の平均：\n全神経0.367 / 7神経4.019','SORA scored −0.016 in the later condition.\nLasting improvement or profit is unproven.\nMean across two additional intervals:\nFull 0.367 / 7-neuron 4.019'),8.12,5.29,4.55,1.43,13.5);
  small(b('保存済み画面（英語UI）。数値は同梱JSONから生成。評価時点と比較条件を区別する。','Saved English GUI; figures generated from the included JSON. Distinguish selection from later evaluation.'),.67,6.82,12,.29);
 }
 if(s.kind==='contribution'){
  const cards=[
   [b('再現手順','Reproduction recipe'),b('V3 pool・テストtoken・市場履歴を\n同じ条件で用意する手順。\n初回起動と再開を分けて説明。','Prepare the V3 pool, test tokens and market history under explicit conditions.\nSeparate first setup from resuming a run.')],
   [b('方策を比較する入口','Policy comparison interface'),b('固定・軽量・全神経の判断を比較。\n価格履歴・費用・評価区間を揃え、\n方策差し替えの例を付ける。','Compare fixed, small and full-model policies.\nAlign history, costs and evaluation intervals; add a replacement example.')],
   [b('説明できる実験記録','Inspectable experiment record'),b('Swap → 観測 → action → quote\n→ outcome → policy版を追跡。\n採用・不採用・別条件を並べる。','Trace Swap → observation → action\n→ quote → outcome → policy version.\nShow adoption, rejection and later results.')],
  ];cards.forEach(([h,bb],j)=>tile(.6+j*4.16,2.4,3.81,3.72,h,bb,[C.blue,C.teal,C.amber][j],14.5));note(b('再利用しやすいツールへの整理は提案。外部開発者による再現・利用はまだ確認していない。','Packaging as a reusable tool is proposed. Independent developer reproduction and adoption are unverified.'));
 }
 if(s.kind==='scope'){
  table([b('優先度','Priority'),b('成果物・作業','Artifact / work'),b('現在の状態','Current status')],[
   [b('A / まず仕上げる','A / Finish first'),b('再現手順・統合コード案内\nFEEDBACK.mdと提出準備','Reproduction and integration guide\nFEEDBACK.md and submission preparation'),b('既存機能を整理する提案\n書類はこれから作成','Proposal to package existing functionality\nSubmission materials still pending')],
   [b('B / 比較を強くする','B / Strengthen evaluation'),b('固定方策との同条件比較\n失敗・不採用を含む短いデモ','Matched fixed-policy comparison\nShort demo including rejection and failure'),b('full / 軽量の記録はある\n新しい固定方策比較は未実施','Full / small results exist\nNew fixed-policy comparison not run')],
   [b('C / 相談後の拡張','C / Optional extension'),b('Agentによる実テストswap\nTrading API / v4の必要性を検討','Actual agent test-token swaps\nConsider Trading API / v4 if useful'),b('現状は未実装の候補\n価値・環境・範囲を先に合意','Not implemented in the current app\nFirst agree on value, environment and scope')],
  ],[3.13,4.94,4.06],{rh:1.14,font:14});note(b('主提案はV3の評価ツール。追加機能を選ぶ理由は、チームの利用課題と必要な証拠。','The main proposal is a V3 evaluation tool. Choose extensions based on user needs and required evidence.'));
 }
 if(s.kind==='demo'){
  const heads=[b('01 / 出典','01 / Source'),b('02 / 判断','02 / Decision'),b('03 / 評価','03 / Outcome'),b('04 / 学習','04 / Learning'),b('05 / 比較','05 / Compare')];
  const bodies=[b('poolとSwapの\nreceiptを開く','Open the pool and\nSwap receipt'),b('観測・身体・方策\nからの選択を示す','Inspect observation,\nbody, policy and action'),b('後のquoteと\n台帳の変化を示す','Show later quotes\nand ledger changes'),b('候補の採否と\n後続方策を示す','Show candidate adoption\nand the policy used later'),b('同じ条件の\n固定方策と並べる','Compare against a fixed\npolicy under equal conditions')];
  heads.forEach((h,j)=>{const x=.6+j*2.48;tile(x,2.53,2.22,2.85,h,bodies[j],j===3?C.teal:C.blue,13.2);if(j<4)arrow(x+2.23,3.55,.24);});
  rect(.6,5.73,12.13,.59,C.ink);text(b('見せる区別：市場生成の実TX / Agentのペーパー台帳 / 保存済み学習 / 次に追加する比較','Label clearly: market-generation TX / agent paper ledger / saved learning / proposed new comparison'),.83,5.91,11.67,.36,13,C.white,true);
  note(b('既存の約64秒の動画は実行・receipt・保存済み評価を表示。新しい比較結果はまだない。','The existing ~64-second video shows execution, receipts and stored evaluation. New comparison results are pending.'),6.53);
 }
 if(s.kind==='acceptance'){
  const cards=[
   [b('1 / 再現できる','1 / Reproduce the workflow'),b('文書の手順で市場とAgentを起動。\npool・履歴・設定を検証できる。','Follow the guide to start the market and agents.\nVerify the pool, history and configuration.')],
   [b('2 / 判断を追跡できる','2 / Trace a decision'),b('元Swapから観測・行動・quote・結果へ。\n方策版と採否まで同じ記録で追う。','Follow a Swap to observation, action, quote and outcome.\nTrace the policy version and adoption record.')],
   [b('3 / 条件を揃えて比較','3 / Compare on equal terms'),b('価格履歴・費用・評価区間を統一。\n改善しない場合もそのまま報告する。','Align history, costs and evaluation intervals.\nReport failure to improve as well as gains.')],
   [b('4 / 要件を提出物に反映','4 / Complete submission requirements'),b('README・公開コード・licenseを確認。\nFEEDBACK.mdとフォームを準備・提出。','Check README, public code and licensing.\nPrepare FEEDBACK.md and complete the form.')],
  ];cards.forEach(([h,bb],j)=>tile(.6+(j%2)*6.21,2.31+Math.floor(j/2)*2.06,5.92,1.9,h,bb,j<2?C.blue:C.teal,13.5));note(b('これは提案する完了条件。外部再現・新しい比較・フォーム提出が完了したという表示ではない。','These are proposed criteria. Independent reproduction, new comparisons and form submission are not complete.'),6.58);
 }
 if(s.kind==='questions')questions.forEach((q,j)=>{const y=2.25+j*.87;rect(.6,y,.49,.49,j<3?C.blue:C.teal);text(String(j+1),.6,y+.12,.49,.3,13,C.white,true,{align:'center'});text(q,1.3,y+.03,11.22,.7,lang==='ja'?17:16);if(j<4)line(1.3,y+.73,12.72,y+.73);});
 if(s.kind==='decision')decisionFields.forEach((f,j)=>{const y=2.17+j*.65;text(f,.7,y,lang==='ja'?5.4:5.8,.5,lang==='ja'?15:13.4,C.ink,true);line(lang==='ja'?6.25:6.65,y+.48,12.7,y+.48,C.line,1.2);});
 if(s.kind==='qa'){
  const cards=[
   [b('Q / 実際に取引している？','Q / Are the trades actual swaps?'),b('市場生成は実V3のテストswap。\nAgentの売買はペーパー台帳で評価。','Market generation uses actual V3 test-token swaps.\nAgent orders are evaluated in a paper ledger.')],
   [b('Q / 何が学習する？','Q / What learns?'),b('固定神経グラフの後段readout。\n神経配線自体は学習で変更しない。','The readout after the fixed neural graph learns.\nLearning does not change the neural wiring.')],
   [b('Q / 利益や全神経の優位は？','Q / Profit or full-model superiority?'),b('未実証。別条件で改善しない例もある。\n比較結果を条件とともに示す。','Unproven; some later conditions do not improve.\nReport comparison results with their conditions.')],
   [b('Q / なぜUniswapに有用？','Q / Why useful to Uniswap?'),b('pool計算と出典を含め、Agentを検証。\n再現可能な評価手順として提案する。','Evaluate agents using pool calculations and provenance.\nPropose a reproducible evaluation workflow.')],
  ];cards.forEach(([h,bb],j)=>tile(.6+(j%2)*6.21,2.31+Math.floor(j/2)*2.11,5.92,1.96,h,bb,j<2?C.blue:C.teal,13.5));
 }
 if(s.kind==='sources'){
  const groups=[
   ['P / F',b('公式プライズ要件・提出フォーム','Official prize requirements and feedback'),'ETHGlobal Tokyo 2026 / Uniswap Foundation · Developer Feedback Form',sources.P.url],
   ['G / R',b('公開リポジトリ・提出案内','Public repository and submission pointers'),'github.com/Polonity/ethglobaltokyo2026-bio-agent · README.md',sources.G.url],
   ['C / H / B',b('V3の実配置・swap・quote','Actual V3 deployment, swaps and quotes'),'services/full-apps/chain.mjs · contracts/test/fixtures/{LocalMarket,FullLocalMarket}.sol'],
   ['M',b('時点を分けたペーパー評価','Paper execution with ordered evaluation blocks'),'services/full-apps/market.mjs'],
   ['N / E',b('学習と保存済み受入結果','Learning and recorded acceptance'),'packages/bio_agent/full_apps/learning.py · docs/submission/evidence/full-apps-acceptance.json'],
   ['V',b('既存の英語デモ・検証記録','Existing English demo and validation'),'artifacts/full-app-demos-20260926/{market-english.mp4,verification.json}'],
  ];groups.forEach(([k,h,body,url],j)=>{const y=2.14+j*.71;label(k,.7,y,1.5);text(h,2.1,y,10.5,.33,15,C.ink,true);text(body,2.1,y+.34,10.5,.31,10.8,url?C.blue:C.muted,false,url?{url}:{});});
  small('MaleCNS: FlyEM / HHMI Janelia, Cambridge, MRC LMB, Google. Data: CC-BY-4.0.',.7,6.69,12,.3);
 }
 line(.6,7.13,12.73,7.13,C.line,.7);text('BIOAGENT / 2026.09.26',.6,7.24,2.3,.2,8,C.muted,true);text('SOURCES '+s.refs.join(' · '),3,7.24,7.8,.2,8,C.muted);text(`${String(i+1).padStart(2,'0')} / ${slides.length}`,11.77,7.2,.97,.27,10,C.blue,true,{align:'right'});return els;
}
