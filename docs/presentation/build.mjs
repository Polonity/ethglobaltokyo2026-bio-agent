import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { b, slides, sources, glossary } from './content.mjs';
import { qa } from './qa.mjs';
const require = createRequire(import.meta.url);
const PptxGenJS = require('/mnt/c/Users/hiken/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/pptxgenjs');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const out = path.join(root, 'artifacts/explanation-slides-20260926');
const evidence = JSON.parse(await fs.readFile(path.join(out, 'evidence-snapshot.json'), 'utf8'));
const C = { bg:'F6F4ED', ink:'142D35', muted:'5A6C70', teal:'167D7F', amber:'BB741C', blue:'466BB2', white:'FFFFFF', line:'D8DFDC', pale:'E6F1ED', sand:'F5E8CF', red:'A35147', dark:'122F38' };
const W = 13.333333, H = 7.5, langValue = (v,l) => typeof v==='object' ? v[l] : v;
const esc = s => String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const scenes = {};

function scene(data, i, lang) {
  const els = [], t = v => langValue(v,lang);
  const shape = (x,y,w,h,fill=C.white,stroke=null,r=0)=>els.push({type:'rect',x,y,w,h,fill,stroke,r});
  const text = (txt,x,y,w,h,size=18,color=C.ink,bold=false,extra={})=>els.push({type:'text',text:t(txt),x,y,w,h,size,color,bold,...extra});
  const line = (x,y,x2,y2,color=C.line,width=1)=>els.push({type:'line',x,y,x2,y2,color,width});
  const circle = (x,y,d,fill=C.teal)=>els.push({type:'ellipse',x,y,w:d,h:d,fill});
  const image = (src,x,y,w,h,crop)=>els.push({type:'image',src,x,y,w,h,crop});
  const arrow=(x,y,w=.3,color=C.teal)=>text('→',x,y,w,.4,19,color,true,{align:'center'});
  const small=(v,x,y,w=12,h=.35)=>text(v,x,y,w,h,11,C.muted);
  const label=(v,x,y,w=3,color=C.teal)=>text(v,x,y,w,.35,11,color,true);
  const callout=(v,y=6.25,color=C.pale)=>{shape(.6,y,12.13,.48,color);text(v,.76,y+.09,11.8,.31,12,C.ink,true);};
  const tile=(x,y,w,h,head,body,color=C.teal,bs=15)=>{
    shape(x,y,w,h,C.white);shape(x,y,.05,h,color);
    text(head,x+.22,y+.23,w-.44,.74,lang==='ja'?18:17,color,true);
    text(body,x+.22,y+.98,w-.44,Math.max(.33,h-1.07),bs,C.ink);
  };
  const table=(headers,rows,widths,{x=.6,y=2.3,rowH=.6,font=16}={})=>{
    let yy=y;
    [headers,...rows].forEach((row,ri)=>{
      let xx=x;
      row.forEach((value,ci)=>{
        shape(xx,yy,widths[ci],ri===0?.52:rowH,ri===0?C.ink:ri%2?C.white:'EDF0EA');
        const tx=typeof value==='object' && value.text ? value.text:value;
        const col=ri===0?C.white:(typeof value==='object'&&value.color?value.color:C.ink);
        text(tx,xx+.14,yy+(ri===0?.13:.15),widths[ci]-.28,(ri===0?.52:rowH)-.21,ri===0?12:font,col,ri===0||ci===0);
        xx+=widths[ci];
      });
      yy+=ri===0?.52:rowH;
    });
    return yy;
  };
  if(data.type==='cover'){
    shape(0,0,W,H,C.dark);shape(.6,.62,.7,.06,C.teal);
    text(data.tag,.6,.92,8,.4,12,'92CECA',true);
    text(data.title,.6,1.63,8.25,1.95,lang==='ja'?45:49,C.white,true);
    text(data.lead,.65,4.05,8.2,1.02,22,'DBE9E5');
    const nodes=[[10.15,1.5],[11.38,2.1],[9.48,2.8],[10.66,3.5],[12.04,3.66],[9.44,4.55],[11.45,5.2],[10.35,5.87]];
    for(let j=0;j<nodes.length;j++)for(let k=j+1;k<nodes.length;k++)if((j+k)%3!==0)line(nodes[j][0],nodes[j][1],nodes[k][0],nodes[k][1],'32616B',1.4);
    nodes.forEach(([x,y],j)=>circle(x-.085,y-.085,j===3?.28:.17,j===3?'DFAF54':'77C4BA'));
    text(b('模式図', 'SCHEMATIC'),9.5,6.3,2.8,.3,10,'92B3B7',false,{align:'center'});
    text('2026.09.26  /  '+(lang==='ja'?'日本語版':'ENGLISH EDITION'),.65,6.64,8,.3,12,'92CECA');
    return els;
  }
  shape(0,0,W,H,C.bg);
  shape(.6,.35,.45,.045,C.teal);
  label(data.tag,1.2,.245,11.5);
  const ttl=t(data.title),titleSize=lang==='ja'?(ttl.length>27?27:30):(ttl.length>62?27:30);
  text(data.title,.6,.68,12.15,.65,titleSize,C.ink,true);
  if(data.lead)text(data.lead,.62,1.48,12.0,.62,lang==='ja'?15:14,C.muted);
  if(['cards','qa'].includes(data.type)){
    const y=data.lead?2.38:1.92;
    data.cards.forEach((c,j)=>tile(.6+j*4.16,y,3.81,data.type==='qa'?3.68:3.72,c.title,c.body,C[c.color]||[C.teal,C.blue,C.amber][j],lang==='ja'?15.5:14.5));
    if(data.takeaway)callout(data.takeaway,6.38);
    if(data.type==='qa')callout(b('回答の型：まず短く答える → 根拠を1つ示す → 主張の範囲を添える。','Answer pattern: give a direct answer → name one piece of evidence → state its scope.'),6.2);
  }
  if(data.type==='versions'){
    table([b('環境','Environment'),b('計算と学習','Computation and learning'),b('用途 / 注意','Purpose / boundary')],[
      [b('公開Worker','Public Worker'),b('旧Q-learning / ブラウザー','Earlier Q-learning / browser'),b('Fly Labの公開デモ','Public Fly Lab demo')],
      ['8800',b('7神経・19接続 / 従来の学習器','7 neurons, 19 edges / original learners'),b('採餌・市場・Aquaの軽量版','Lightweight foraging, market, Aqua')],
      ['8810',b('166,700神経 / 固定回路','166,700 neurons / fixed circuit'),b('刺激応答・速度・状態復元の実験','Response, performance, state restoration')],
      [{text:'8812',color:C.teal},b('全神経 または7神経 / 共通readout','Full or 7 neurons / shared readout learner'),b('3アプリの経験学習・比較（主対象）','Three-app learning and comparison (main)')],
      ['Sepolia',b('未配置','Not deployed'),b('ローカルAnvil実行と区別する','Separate from local Anvil execution')],
    ].map(r=>r.map(v=>v?.text?v:t(v))),[2.1,5.1,4.93],{font:15,rowH:.67});
    callout(b('8812の「7神経モード」は、8800の従来ブラウザー版そのものではない。','The seven-neuron mode at 8812 is not identical to the original browser implementation at 8800.'),6.38);
  }
  if(data.type==='pipeline'){
    shape(.6,2.32,2.56,3.49,C.pale); label(b('ONCHAIN / Anvil','ONCHAIN / Anvil'),.84,2.56,2.2);
    text(b('登録・刺激\nSwap・戦略TX','Registration / stimuli\nSwaps / strategy TXs'),.84,3.13,2.13,1.2,lang==='ja'?21:16,C.teal,true);
    small(b('receipt・blockHash','Receipts / block hashes'),.84,4.73,2.1,.6);
    arrow(3.23,3.6);
    const parts=[ [b('入力変換','Input encoding'),b('Nodeの環境\n16本の人工入力','Node environments\n16 engineered drives')], [b('神経計算','Neural runtime'),b('Python / 固定グラフ\n4 step → 集約特徴','Python / fixed graph\n4 steps → features')], [b('行動・実結果','Action / outcome'),b('readout → 行動\n環境更新 またはTX','Readout → action\nEnvironment or TX')] ];
    parts.forEach(([a,bb],j)=>{const x=3.68+j*3.08;tile(x,2.8,2.77,2.33,a,bb,[C.teal,C.blue,C.amber][j],14);if(j<2)arrow(x+2.79,3.6);});
    label(b('OFFCHAIN / Node + Python','OFFCHAIN / Node + Python'),3.7,2.3,8);
    line(11.26,5.18,11.26,5.58,C.teal,2);line(11.26,5.58,5,5.58,C.teal,2);
    shape(4.15,5.29,5.8,.64,C.white,C.line);text(b('SQLiteへ保存 → 学習・評価 → 次の方策','Save in SQLite → train / evaluate → next policy'),4.34,5.43,5.42,.38,14,C.teal,true);
    callout(b('全神経状態・身体・学習の処理を、コントラクトに保存・実行しているわけではない。','Contracts do not store and execute the full neural state, body simulation and learning process.'),6.38);
  }
  if(data.type==='scope'){
    const stats=[['166,700',b('分類付き神経 / 個体','classified neurons / individual')],['25,582,938',b('神経間の接続ペア','connected neuron pairs')],['2',b('独立した個体の状態','independent individual states')]];
    stats.forEach(([n,cap],j)=>{const x=.6+j*4.16;shape(x,2.35,3.81,1.55,C.white);text(n,x+.2,2.55,3.42,.83,j===1?30:40,C.teal,true);small(cap,x+.22,3.42,3.4,.3);});
    tile(.6,4.17,5.91,1.81,b('対象に含む','Included'),b('分類付き神経の内部接続。低次数や孤立神経も保持。\n接続数を重みに使い、疎行列で計算する。','Internal edges among classified neurons; isolated neurons retained.\nSynapse counts supply weights in a sparse matrix.'),C.teal,14);
    tile(6.81,4.17,5.92,1.81,b('対象から除く','Excluded'),b('未分類の44,877注釈行と境界をまたぐ接続。\n除外した部分が不要だと証明したわけではない。','44,877 unclassified rows and edges crossing the boundary.\nTheir biological irrelevance has not been established.'),C.amber,14);
    callout(b('「全分類付き神経のグラフ」を使う人工モデル。生理的な全脳再現ではない。','An artificial model using the full classified-neuron graph; not a validated physiological whole-brain simulation.'),6.38);
  }
  if(data.type==='learning'){
    const flow=[['200',b('動作を収集','collect actions'),b('観測・特徴・行動\n結果と出典を保存','Save observations, features,\nactions, outcomes and sources')],['70 / 30',b('fit / 予測の確認','fit / prediction check'),b('保存した経験を分割\nreadoutだけを学習','Split recorded experience\nTrain only the readout')],['80 × 2',b('旧方策 / 候補','old / candidate'),b('別実行の累積報酬で比較\n個体ごとに採用・棄却','Compare fresh rollout rewards\nAdopt or reject per individual')],['80',b('さらに別条件','another condition'),b('採用方策の使用を確認\n性能の持続も観察','Verify adopted-policy use\nInspect out-of-selection behavior')]];
    flow.forEach(([n,a,bb],j)=>{const x=.6+j*3.1;shape(x,2.36,2.82,3.21,C.white);text(n,x+.19,2.59,2.45,.64,31,[C.teal,C.blue,C.amber,C.teal][j],true);text(a,x+.19,3.48,2.44,.58,16,C.ink,true);text(bb,x+.19,4.24,2.44,1.04,13.5,C.muted);if(j<3)arrow(x+2.82,3.32,.28);});
    callout(b('予測誤差が小さい ≠ 行動結果が改善。採用には別実行の結果を使う。','Lower prediction error ≠ better behavior. Adoption requires outcomes from separate execution.'),5.9);
    small(b('200 / 80はGUI標準の行動回数。fitは保存済みcollect/live経験を使用し、selection/testを除外。','200 / 80 are default GUI action counts. Fitting uses stored collect/live experience and excludes selection/test data.'),.65,6.52,12,.34);
  }
  if(data.type==='screenshot'){
    shape(.6,2.24,7.51,4.63,C.white,C.line);
    // Crop is a presentation viewport over the original capture, not an altered evidence file.
    image(path.join(out,`assets/${data.app}-full-gui.png`),.63,2.27,7.45,4.57,{x:124,y:data.app==='foraging'?390:360,w:1195,h:733});
    data.cards.forEach((c,j)=>{
      const y=2.28+j*1.5;shape(8.37,y,4.35,1.32,C.white);shape(8.37,y,.05,1.32,[C.teal,C.blue,C.amber][j]);
      text(c.title,8.56,y+.12,3.98,.34,16,[C.teal,C.blue,C.amber][j],true);
      text(c.body,8.56,y+.52,3.98,.77,lang==='ja'?13.6:12.9,C.ink);
    });
    small(b('2026-09-26 保存済み受入画面（英語UI）。性能値は固定JSONを参照。','Saved acceptance GUI (2026-09-26). Use the frozen JSON for performance figures.'),.65,6.9,12,.24);
  }
  if(data.type==='timeline'){
    const flow=[ [b('観測ブロック','Observation block'),b('価格・保有・身体\n→ 神経計算 → 判断','Price, position and body\n→ neural inference → action')], [b('次の記録ブロック','Next recorded block'),b('quoteを取得\n仮想約定を評価','Retrieve a quote\nEvaluate paper execution')], [b('さらに次のブロック','Following recorded block'),b('保有を値洗い\n報酬を保存','Mark the position to market\nRecord the reward')] ];
    flow.forEach(([a,bb],j)=>{const x=.6+j*4.16;circle(x+.12,2.48,.4,[C.teal,C.blue,C.amber][j]);text(String(j+1),x+.12,2.49,.4,.3,15,C.white,true,{align:'center'});if(j<2)line(x+.64,2.68,x+4.1,2.68,C.line,2);tile(x,3.1,3.81,2.27,a,bb,[C.teal,C.blue,C.amber][j],16);});
    callout(b('初期100 token1。手数料・価格影響を含む。ガスは1取引0.001 token1という仮定。','Initial balance: 100 token1. Includes fees and price impact; assumed gas is 0.001 token1 per trade.'),5.78);
    small(b('同じ観測価格で即時約定したと見なさない。未知の市場での利益を証明する評価ではない。','No assumed instant execution at the observed price. This does not establish profitability in unseen markets.'),.7,6.42,12,.45);
  }
  if(data.type==='adoption'){
    const rows=[];
    for(const [app,name] of [['foraging',b('採餌','Foraging')],['market',b('市場','Market')],['aqua','Aqua']]){
      const d=evidence.gui[`${app}:full`];
      for(let j=0;j<2;j++)rows.push([t(name)+' / '+['MOMO','SORA'][j],d.before[j].toFixed(3),d.after[j].toFixed(3),{text:(d.adopted[j]?t(b('採用','Adopt')):t(b('維持','Keep')))+` v${d.versions[j]}`,color:d.adopted[j]?C.teal:C.amber},d.test[j].toFixed(3)]);
    }
    table([b('用途 / 個体','App / individual'),b('旧方策','Old policy'),b('候補','Candidate'),b('判断','Decision'),b('別条件の結果','Next condition')],rows,[3.2,2.02,2.03,2.1,2.78],{y:2.2,rowH:.55,font:15});
    callout(b('市場SORAは採用時 +2.387 → 別条件 −0.016。改善の持続は保証しない。','Market SORA: +2.387 during selection → −0.016 in the next condition. Improvement is not guaranteed.'),6.27);
  }
  if(data.type==='comparison'){
    const groups=[['foraging',b('採餌','Foraging'),b('3 seed','3 seeds')],['market',b('市場','Market'),b('2区間','2 intervals')],['aqua','Aqua',b('2区間','2 intervals')]];
    groups.forEach(([app,title,cap],j)=>{
      const a=evidence.comparison.find(x=>x.app===app&&x.variant==='full'),bb=evidence.comparison.find(x=>x.app===app&&x.variant==='legacy');
      const x=.6+j*4.16;shape(x,2.46,3.81,3.45,C.white);text(title,x+.23,2.7,3.34,.5,21,C.ink,true);small(cap,x+.23,3.28,3.2,.3);
      label(b('全神経','FULL'),x+.23,3.94,1.44,C.teal);text(a.meanRewardPerIndividual.toFixed(3),x+1.66,3.78,1.86,.6,29,C.teal,true,{align:'right'});
      line(x+.23,4.54,x+3.56,4.54);
      label(b('7神経encoder','7-NEURON'),x+.23,4.98,1.44,C.blue);text(bb.meanRewardPerIndividual.toFixed(3),x+1.66,4.82,1.86,.6,29,C.blue,true,{align:'right'});
    });
    callout(b('用途間の報酬は比較しない。入力mapping・状態継続・step数の差も含む比較。','Do not compare reward units across applications. Encoding, state persistence and step count also differ.'),6.24);
  }
  if(data.type==='performance'){
    const rows=['foraging','market','aqua'].map(app=>{
      const f=evidence.comparison.find(x=>x.app===app&&x.variant==='full'),l=evidence.comparison.find(x=>x.app===app&&x.variant==='legacy');
      return [t({foraging:b('採餌','Foraging'),market:b('市場','Market'),aqua:'Aqua'}[app]),f.neuralMsPerJointDecision.toFixed(2),l.neuralMsPerJointDecision.toFixed(3),f.endToEndMsPerJointDecision.toFixed(2)];
    });
    table([b('用途','App'),b('全神経 / 神経 ms','Full / neural ms'),b('7神経 / 神経 ms','7-neuron / neural ms'),b('全神経 / 全処理 ms','Full / end-to-end ms')],rows,[2.12,3.2,3.4,3.41],{y:2.35,rowH:.75,font:21});
    text(b('AquaはTX待ちがあるため、神経計算以外の時間が大きい。','Transaction waiting adds substantial non-neural time in Aqua.'),.72,5.48,11.8,.45,18,C.teal,true);
    callout(b('神経step/秒 ≠ 判断/秒 ≠ 描画fps。約30fpsは8810専用GUIの描画更新。','Neural steps/s ≠ decisions/s ≠ rendering fps. The ~30-fps example is rendering in the separate port-8810 lab.'),6.22);
  }
  if(data.type==='ablation'){
    const rows=evidence.ablation.cases.map(r=>[t({foraging:b('採餌','Foraging'),market:b('市場','Market'),aqua:'Aqua'}[r.app]),`${r.changedArgmax[0]} / 32`,`${r.changedArgmax[1]} / 32`]);
    table([b('用途','App'),b('MOMO / 行動argmax変化','MOMO / changed action argmax'),b('SORA / 行動argmax変化','SORA / changed action argmax')],rows,[2.5,4.8,4.83],{y:2.36,rowH:.67,font:21});
    tile(.6,5.12,5.91,1.35,b('分かること','Supported'),b('接続が、特徴・行動スコアの計算に寄与する。','Connectivity contributes to features and action scores.'),C.teal,13);
    tile(6.81,5.12,5.92,1.35,b('まだ分からないこと','Not established'),b('生物的配線の優位性、実動物の行動の再現。','Biological wiring superiority or faithful animal behavior.'),C.amber,13);
    small(b('許可行動mask前の人工probe。アプリの勝率や実動物の実験ではない。','Artificial probes before action masking; not an application win-rate or animal experiment.'),.7,6.65,12,.3);
  }
  if(data.type==='trace'){
    const items=[b('入力・モデルのhash','Input / model hashes'),b('decision + outcome','decision + outcome'),b('候補・採用の記録','Candidate / adoption records'),b('次の方策版・復元','Later policy version / restore')];
    items.forEach((x,j)=>{const xx=.6+j*3.1;shape(xx,2.42,2.82,1.15,C.white);text(x,xx+.18,2.7,2.45,.67,lang==='ja'?17:15.5,C.teal,true);if(j<3)arrow(xx+2.82,2.8,.28);});
    const total=evidence.experienceCounts.reduce((s,r)=>s+r.decisions,0);
    text(total.toLocaleString('en-US'),.7,4.12,4,.82,44,C.teal,true);
    text(b('decision と outcomeが対応\n（受入時スナップショット）','paired decisions and outcomes\n(at the recorded acceptance snapshot)'),.74,5.04,4.2,.76,16,C.muted);
    tile(5.17,4.04,7.55,2.15,b('保存・監査で確認したこと','Persistence and audit checks'),b('評価データをfitへ混ぜない / 方策hashの一致\n採用した版を後続判断で使用 / 3用途で再起動後に復元','Evaluation excluded from fit / policy hashes match\nAdopted versions used later / restored in all three apps'),C.blue,15);
    callout(b('8812の方策復元と、8810の全神経状態checkpointは別の成果。hashは正しさの証明ではない。','Policy restoration at 8812 differs from full-state checkpoints at 8810. A hash does not prove correctness.'),6.4);
  }
  if(data.type==='demo'){
    const steps=[
      [b('1分','1 min'),b('全体像','Orient'),b('全神経・2個体・3用途を示す','Show full mode, two individuals and three apps')],
      [b('2分','2 min'),b('採餌とTX','Foraging + TX'),b('刺激を変える → 反応 → 元のreceiptを開く','Change a stimulus → observe → open the receipt')],
      [b('2分','2 min'),b('学習結果','Learning'),b('旧方策・候補・採否・別条件を区別する','Separate old policy, candidate, adoption and next condition')],
      [b('2分','2 min'),b('市場とAqua','Market + Aqua'),b('ペーパー注文とテスト交換の実TXを区別する','Distinguish paper orders from actual test-token fills')],
      [b('1分','1 min'),b('検証の境界','Evidence limits'),b('人工モデル・比較の限界・profile案を説明する','Explain engineered assumptions, comparison limits and the profile')],
    ];
    table([b('説明の目安','Talk time'),b('見せるもの','Show'),b('話すこと','Explain')],steps.map(r=>r.map(t)),[1.65,2.56,7.92],{y:2.23,rowH:.66,font:15});
    callout(b('時間は説明の目安。学習・TXの完了時間を保証するものではない。','Times are a talk outline, not guaranteed completion times for training or transactions.'),6.36);
  }
  if(data.type==='boundaries'){
    const rows=[
      [b('3用途の実動作・経験学習','Three-app execution and learning'),b('ローカル受入記録で確認','Supported by local acceptance records')],
      [b('実測接続が計算に入る','Measured edges affect computation'),b('接続除去probeで応答差','Response difference in removal probes')],
      [b('本物の脳・感情・意識','Faithful brain, emotion or consciousness'),b('証拠なし / 人工動力学・表示','Not established / artificial dynamics and labels')],
      [b('全神経の普遍的優位・実利益','Universal superiority or real profit'),b('未実証 / 少数条件・代理評価','Not established / limited and proxy evaluations')],
      [b('本番運用・標準準拠','Production readiness or conformance'),b('未完了 / Anvil・profile提案','Incomplete / Anvil and a proposed profile')],
    ];
    table([b('主張の対象','Claim'),b('現在の答え','Current answer')],rows.map(r=>r.map(t)),[6.05,6.08],{y:1.95,rowH:.76,font:16});
    callout(b('「何を確認したか」を先に答え、条件を続ける。広い言葉へ言い換えすぎない。','State what was verified, then give the conditions. Avoid turning a narrow result into a broad claim.'),6.42);
  }
  if(data.type==='glossary'){
    table([b('用語','Term'),b('このプロジェクトでの意味','Meaning in this project')],glossary.map(([a,bb])=>[a,t(bb)]),[3.08,9.05],{y:1.88,rowH:.52,font:15});
  }
  if(data.type==='sources'){
    const lines=[
      ['A / B',b('受入結果・固定数値','Acceptance results and fixed figures'),'docs/submission/full-apps-acceptance.md\ndocs/submission/evidence/full-apps-acceptance.json'],
      ['C / D',b('画面の読み方・全神経の対象','UI meanings and neural scope'),'docs/apps/  ·  docs/design/malecns-full-local.md'],
      ['E / F',b('学習と神経計算の実装','Learning and neural implementation'),'packages/bio_agent/full_apps/{learning,brain}.py'],
      ['G / H',b('共通仕様の提案と契約の境界','Profile proposal and contract boundaries'),'docs/standards/{embodied-learning-profile,bio-agent-draft}.md'],
      ['I / J',b('外部一次資料','External primary sources'),'male-cns.janelia.org  ·  eips.ethereum.org/EIPS/eip-8004'],
    ];
    lines.forEach(([key,head,body],j)=>{const y=2.18+j*.76;label(key,.7,y,1.1);text(head,1.77,y,10.75,.3,14,C.ink,true);text(body,1.77,y+.32,10.75,.4,11,C.muted);});
    callout(b('原稿・24問の想定問答・検証記録は、同じ成果物フォルダーへ収録。','Speaker notes, 24 Q&A items and artifact-validation records are in the same output folder.'),6.36);
  }
  if(data.app==='aqua')text('Powered by Aqua — © Degensoft Ltd 2025',8.48,6.82,4.25,.27,9,C.muted);
  line(.6,7.15,12.73,7.15,C.line,.7);
  text('BIOAGENT  /  2026.09.26',.6,7.23,3.1,.2,8.5,C.muted,true);
  text('SOURCES  '+data.refs.join(' · '),3.65,7.23,7.6,.2,8.5,C.muted);
  text(`${String(i+1).padStart(2,'0')} / ${slides.length}`,11.73,7.2,1,.24,10,C.teal,true,{align:'right'});
  return els;
}

const imageCache = new Map();
async function imageData(src){
  if(!imageCache.has(src)){
    const buf=await fs.readFile(src);imageCache.set(src,{data:'data:image/png;base64,'+buf.toString('base64'),w:buf.readUInt32BE(16),h:buf.readUInt32BE(20)});
  }
  return imageCache.get(src);
}
function notesFor(s,lang,i){
  return `${String(i+1).padStart(2,'0')}. ${langValue(s.title,lang).replaceAll('\n',' ')}\n\n${langValue(s.notes,lang)}\n\n${lang==='ja'?'出典':'Sources'}\n`+
    s.refs.map(key=>`[${key}] ${sources[key].path||sources[key].url}`).join('\n');
}
async function htmlElement(e){
  const base=`left:${e.x*96}px;top:${e.y*96}px;width:${e.w*96}px;height:${e.h*96}px;`;
  if(e.type==='text')return `<div class="txt" style="${base}font-size:${e.size*96/72}px;color:#${e.color};font-weight:${e.bold?700:400};text-align:${e.align||'left'}">${esc(e.text)}</div>`;
  if(e.type==='rect'||e.type==='ellipse')return `<div class="shape" style="${base}background:#${e.fill};border-radius:${e.type==='ellipse'?'50%':e.r+'px'};${e.stroke?'border:1px solid #'+e.stroke:''}"></div>`;
  if(e.type==='line'){
    const x=Math.min(e.x,e.x2),y=Math.min(e.y,e.y2),w=Math.abs(e.x2-e.x),h=Math.abs(e.y2-e.y);
    return `<svg class="shape" style="left:${x*96}px;top:${y*96}px;width:${Math.max(w*96,2)}px;height:${Math.max(h*96,2)}px;overflow:visible"><line x1="${(e.x-x)*96}" y1="${(e.y-y)*96}" x2="${(e.x2-x)*96}" y2="${(e.y2-y)*96}" stroke="#${e.color}" stroke-width="${e.width*96/72}"/></svg>`;
  }
  if(e.type==='image'){
    const im=await imageData(e.src);
    if(e.crop){const q=e.crop,sx=e.w*96/q.w,sy=e.h*96/q.h;
      return `<div class="image" style="${base}overflow:hidden"><img alt="Saved acceptance GUI" src="${im.data}" style="position:absolute;max-width:none;left:${-q.x*sx}px;top:${-q.y*sy}px;width:${im.w*sx}px;height:${im.h*sy}px"></div>`;
    }
    return `<img class="image" alt="Evidence" src="${im.data}" style="${base}object-fit:contain">`;
  }
}
function runtimeScript(){return `
const pages=[...document.querySelectorAll('.slide')];let current=0,notes=false;
function move(n){current=Math.max(0,Math.min(pages.length-1,n));pages[current].scrollIntoView({behavior:'instant',block:'start'});document.querySelector('#count').textContent=(current+1)+' / '+pages.length;document.querySelector('#notes').textContent=pages[current].dataset.notes;}
document.addEventListener('keydown',e=>{if(['ArrowRight','PageDown',' '].includes(e.key)){e.preventDefault();move(current+1)}if(['ArrowLeft','PageUp'].includes(e.key)){e.preventDefault();move(current-1)}if(e.key.toLowerCase()==='n'){notes=!notes;document.body.classList.toggle('show-notes',notes)}});
document.querySelector('#prev').onclick=()=>move(current-1);document.querySelector('#next').onclick=()=>move(current+1);document.querySelector('#toggle').onclick=()=>{notes=!notes;document.body.classList.toggle('show-notes',notes)};
function resize(){const scale=Math.min(1,(innerWidth-28)/1280);document.documentElement.style.setProperty('--scale',scale);document.documentElement.style.setProperty('--page-height',(720*scale)+'px')};addEventListener('resize',resize);resize();move(0);
`;}
for(const lang of ['ja','en']){
  const pptx = new PptxGenJS();pptx.defineLayout({name:'BIO_WIDE',width:W,height:H});pptx.layout='BIO_WIDE';
  pptx.author='BioAgent project';pptx.subject=lang==='ja'?'現時点の成果物・仕組み・検証・質疑応答':'Deliverables, architecture, evidence and Q&A';
  pptx.title=lang==='ja'?'BioAgent 成果説明':'BioAgent — What we built';pptx.company='BioAgent';pptx.lang=lang==='ja'?'ja-JP':'en-US';
  pptx.theme={headFontFace:'Yu Gothic',bodyFontFace:'Yu Gothic',lang:pptx.lang};
  scenes[lang]=[];let pages=[],study=`# ${pptx.title}\n\n2026-09-26 · ${slides.length} slides · ${lang==='ja'?'保存済み受入記録による説明資料':'Study deck based on recorded acceptance evidence'}\n\n`;
  for(const [i,s] of slides.entries()){
    const els=scene(s,i,lang);scenes[lang].push(els);const sl=pptx.addSlide();sl.background={color:C.bg};
    for(const e of els){
      if(e.type==='text')sl.addText(e.text,{x:e.x,y:e.y,w:e.w,h:e.h,fontFace:'Yu Gothic',fontSize:e.size,color:e.color,bold:e.bold,margin:0,breakLine:false,valign:'top',align:e.align||'left',paraSpaceAfter:0,lineSpacingMultiple:1.2,wrap:true,transparency:0});
      else if(e.type==='rect'||e.type==='ellipse')sl.addShape(e.type==='ellipse'?pptx.ShapeType.ellipse:pptx.ShapeType.rect,{x:e.x,y:e.y,w:e.w,h:e.h,fill:{color:e.fill},line:{color:e.stroke||e.fill,width:e.stroke?0.7:0,transparency:e.stroke?0:100},radius:e.r||0});
      else if(e.type==='line')sl.addShape(pptx.ShapeType.line,{x:Math.min(e.x,e.x2),y:Math.min(e.y,e.y2),w:Math.abs(e.x2-e.x),h:Math.abs(e.y2-e.y),flipV:(e.x2-e.x)*(e.y2-e.y)<0,line:{color:e.color,width:e.width}});
      else if(e.type==='image'){
        const im=await imageData(e.src);
        if(e.crop){const q=e.crop;sl.addImage({data:im.data,x:e.x,y:e.y,w:im.w*e.w/q.w,h:im.h*e.h/q.h,sizing:{type:'crop',x:q.x*e.w/q.w,y:q.y*e.h/q.h,w:e.w,h:e.h}});}
        else sl.addImage({data:im.data,x:e.x,y:e.y,w:e.w,h:e.h,sizing:{type:'contain',w:e.w,h:e.h}});
      }
    }
    const notes=notesFor(s,lang,i);sl.addNotes(notes);
    pages.push(`<section class="page"><article class="slide" id="slide-${i+1}" data-slide="${i+1}" data-notes="${esc(notes)}">${(await Promise.all(els.map(htmlElement))).join('')}</article></section>`);
    study+=`## ${i+1}. ${langValue(s.title,lang).replaceAll('\n',' ')}\n\n${langValue(s.notes,lang)}\n\n`;
    if(s.cards)for(const c of s.cards)study+=`- **${langValue(c.title,lang)}**: ${langValue(c.body,lang).replaceAll('\n',' ')}\n`;
    study+=`\n${lang==='ja'?'参照':'References'}: ${s.refs.map(k=>`[${k}] ${sources[k].path||sources[k].url}`).join(' · ')}\n\n`;
  }
  const html=`<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(pptx.title)}</title><style>
*{box-sizing:border-box}body{margin:0;background:#23353b;font-family:'Yu Gothic','Noto Sans CJK JP',sans-serif} .page{width:calc(1280px * var(--scale,1));height:var(--page-height,720px);margin:20px auto 38px;position:relative}.slide{width:1280px;height:720px;position:absolute;top:0;left:0;background:#${C.bg};overflow:hidden;transform:scale(var(--scale,1));transform-origin:top left}.txt,.shape,.image{position:absolute}.txt{white-space:pre-line;line-height:1.2;word-break:normal;overflow-wrap:normal}nav{position:fixed;z-index:10;right:18px;bottom:16px;background:#122f38;color:white;padding:9px 14px;border-radius:9px;display:flex;align-items:center;gap:10px;font:13px sans-serif}nav a{color:#a3d9d3}button{background:#fff;border:0;padding:7px 10px;border-radius:4px;cursor:pointer}#notes{display:none;position:fixed;left:20px;right:20px;bottom:70px;max-height:230px;overflow:auto;background:#fff9e9;padding:18px;white-space:pre-wrap;font-size:15px;line-height:1.55;border:1px solid #bcb5a4;z-index:8}.show-notes #notes{display:block}@page{size:13.333333in 7.5in;margin:0}@media print{body{background:white}.page{width:1280px;height:720px;margin:0;break-after:page;page-break-after:always}.page:last-of-type{break-after:auto;page-break-after:auto}.slide{transform:none}nav,#notes{display:none!important}}
</style></head><body>${pages.join('')}<aside id="notes"></aside><nav><a href="index.html">${lang==='ja'?'日英切替':'Languages'}</a><button id="prev">←</button><span id="count"></span><button id="next">→</button><button id="toggle">${lang==='ja'?'補足 (N)':'Notes (N)'}</button><a href="BioAgent-${lang}.pptx">PPTX</a><a href="BioAgent-${lang}.pdf">PDF</a></nav><script>${runtimeScript()}</script></body></html>`;
  await fs.writeFile(path.join(out,`BioAgent-${lang}.html`),html);
  await fs.writeFile(path.join(out,`study-notes-${lang}.md`),study);
  await pptx.writeFile({fileName:path.join(out,`BioAgent-${lang}.pptx`)});
}
let qmd='# BioAgent 想定問答 / Q&A\n\n2026-09-26 · 24 questions · 日英対訳。スライド24〜26は要点版、以下は補足です。\n\n';
qa.forEach(([q,a,refs],i)=>{qmd+=`## ${i+1}. ${q.ja.replace(/^Q  /,'')}\n\n${a.ja.replace(/^A  /,'').replaceAll('\n',' ')}\n\n**${q.en.replace(/^Q  /,'')}**\n\n${a.en.replace(/^A  /,'').replaceAll('\n',' ')}\n\n参照 / Evidence: ${refs}\n\n`;});
qmd+='## Source key\n\n'+Object.entries(sources).map(([k,v])=>`- [${k}] ${v.path||v.url}`).join('\n')+'\n';
await fs.writeFile(path.join(out,'qa-bilingual.md'),qmd);
await fs.writeFile(path.join(out,'scene-manifest.json'),JSON.stringify({slides:slides.length,languages:['ja','en'],scenes},null,2));
const home=`<!doctype html><html lang="ja"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>BioAgent — 説明スライド</title><style>body{font:17px/1.7 'Yu Gothic','Noto Sans CJK JP',sans-serif;margin:0;background:#f6f4ed;color:#142d35}main{max-width:1000px;margin:65px auto;padding:25px}small{color:#167d7f;letter-spacing:.13em}h1{font-size:46px;line-height:1.25}section{display:flex;gap:22px;margin:35px 0}article{flex:1;background:white;padding:26px;border-top:5px solid #167d7f}a{color:#167d7f}article a{display:block;margin:12px 0}p{max-width:850px}.minor{font-size:14px;color:#5a6c70}@media(max-width:700px){section{display:block}article{margin:20px 0}h1{font-size:34px}}</style><main><small>BIOAGENT / 2026.09.26</small><h1>成果を理解し、質問に答える。<br>Understand the build.</h1><p>日本語・英語それぞれ28枚。実装、3アプリ、学習結果、比較の限界、想定問答をまとめました。PowerPointには発表者ノートを収録しています。</p><section><article><h2>日本語</h2><a href="BioAgent-ja.html">スライドを開く →</a><a href="BioAgent-ja.pdf">PDFを開く</a><a href="BioAgent-ja.pptx">PowerPointをダウンロード</a><a href="study-notes-ja.md">説明原稿</a></article><article><h2>English</h2><a href="BioAgent-en.html">Open the slide deck →</a><a href="BioAgent-en.pdf">Open PDF</a><a href="BioAgent-en.pptx">Download PowerPoint</a><a href="study-notes-en.md">Speaker notes</a></article></section><p><a href="qa-bilingual.md">24問の日英想定問答 / 24 bilingual Q&A items</a></p><p class="minor">数値は2026-09-26の保存済み受入記録です。全神経処理はローカル実行で、公開Workerの旧版と異なります。全脳の生物学的再現・性能の普遍的優位性・実利益を証明する資料ではありません。</p><p class="minor">Sources: <a href="https://male-cns.janelia.org/">MaleCNS</a> · <a href="https://eips.ethereum.org/EIPS/eip-8004">ERC-8004</a> · <a href="source-audit.json">Source audit</a> · <a href="validation.json">Artifact checks</a></p><p class="minor">MaleCNS attribution: FlyEM / HHMI Janelia, Cambridge, MRC LMB, Google. Data: CC-BY-4.0.<br>Powered by Aqua — © Degensoft Ltd 2025.</p></main></html>`;
await fs.writeFile(path.join(out,'index.html'),home);
console.log(JSON.stringify({out,slides:slides.length,qa:qa.length,languages:['ja','en']}));
