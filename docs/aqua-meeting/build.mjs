import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { b, slides, sources, questions, decisionFields } from './content.mjs';
const require=createRequire(import.meta.url);
const PptxGenJS=require('/mnt/c/Users/hiken/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/pptxgenjs');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const out=path.join(root,'artifacts/1inch-aqua-meeting-20260926');
const evidence=JSON.parse(await fs.readFile(path.join(out,'evidence-snapshot.json'),'utf8'));
const C={bg:'F5F7FA',ink:'132D46',muted:'53667A',blue:'2665C7',teal:'067D7F',amber:'A75F14',white:'FFFFFF',line:'D3DFEA',pale:'E4F1F2',sand:'FCEDD7',dark:'10273E'};
const W=13.333333,H=7.5,tv=(v,l)=>typeof v==='object'?v[l]:v;
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const scenes={};

function scene(s,i,lang){
 const els=[],t=v=>tv(v,lang);
 const rect=(x,y,w,h,fill=C.white,stroke)=>els.push({type:'rect',x,y,w,h,fill,stroke});
 const text=(v,x,y,w,h,size=18,color=C.ink,bold=false,extra={})=>els.push({type:'text',text:t(v),x,y,w,h,size,color,bold,...extra});
 const line=(x,y,x2,y2,color=C.line,width=1)=>els.push({type:'line',x,y,x2,y2,color,width});
 const label=(v,x,y,w=3,color=C.blue)=>text(v,x,y,w,.34,11,color,true);
 const small=(v,x,y,w=12,h=.4)=>text(v,x,y,w,h,11,C.muted);
 const arrow=(x,y,w=.34)=>text('→',x,y,w,.38,16,C.blue,true,{align:'center'});
 const note=(v,y=6.39,color=C.pale)=>{rect(.6,y,12.13,.49,color);text(v,.77,y+.1,11.78,.3,12,C.ink,true);};
 const tile=(x,y,w,h,head,body,color=C.blue,bs=15)=>{
  rect(x,y,w,h);rect(x,y,.045,h,color);text(head,x+.22,y+.19,w-.44,.7,lang==='ja'?18:17,color,true);text(body,x+.22,y+.98,w-.44,h-1.11,bs);
 };
 const table=(headers,rows,widths,{x=.6,y=2.26,rh=.75,font=14,headH=.48}={})=>{
  let yy=y;[headers,...rows].forEach((row,ri)=>{let xx=x;row.forEach((v,ci)=>{const h=ri?rh:headH;rect(xx,yy,widths[ci],h,ri?(ri%2?C.white:'EAF0F6'):C.ink);if(t(v))text(v,xx+.13,yy+.12,widths[ci]-.26,h-.19,ri?font:11,ri?C.ink:C.white,ri===0||ci===0);xx+=widths[ci];});yy+=ri?rh:headH;});
 };
 if(s.kind==='cover'){
  rect(0,0,W,H,C.dark);rect(.62,.7,.62,.055,'58CBCA');
  text(s.tag,.65,1,11.5,.35,12,'8BD7DE',true);
  text(s.title,.6,1.77,9.8,1.76,lang==='ja'?44:43,C.white,true);
  text(s.lead,.66,4.05,10.8,1.06,22,'DDEAF4');
  const states=[b('現状を確認','REVIEW'),b('希望を聞く','DISCUSS'),b('次を合意','AGREE')];
  states.forEach((v,j)=>{rect(.65+j*3.32,5.76,2.95,.65,j===2?C.teal:'1C3D5B');text(v,.86+j*3.32,5.94,2.53,.34,14,C.white,true);if(j<2)text('→',3.68+j*3.32,5.92,.3,.3,17,'8BD7DE');});
  text('2026.09.26  /  '+(lang==='ja'?'日本語版':'ENGLISH EDITION'),.66,6.8,7,.3,11,'9EC1D9');
  text('DISCUSSION DRAFT',10.05,6.8,2.6,.3,11,'9EC1D9',true,{align:'right'});
  return els;
 }
 rect(0,0,W,H,C.bg);rect(.6,.34,.45,.045,C.blue);label(s.tag,1.2,.25,11.5);
 const title=t(s.title);text(s.title,.6,.7,12.13,.64,lang==='ja'?(title.length>28?26:29):(title.length>66?25:28),C.ink,true);
 text(s.lead,.62,1.48,12.05,.64,lang==='ja'?15:14,C.muted);
 if(s.kind==='cards'){
  s.cards.forEach((c,j)=>tile(.6+j*4.16,2.38,3.81,3.69,c.head,c.body,[C.blue,C.teal,C.amber][j],15));note(s.foot);
 }
 if(s.kind==='requirements'){
  table([b('公式に求められること','Official criterion'),b('こちらの現在地','Our current status'),b('打ち合わせで確認','Clarify with the team')],[
   [b('Aqua上のDeFiポジション','DeFi position built on Aqua'),b('固定1:1価格の3行動デモ','Three-action demo; fixed 1:1 price'),b('どのポジションが価値を示すか','Which position best shows value?')],
   [b('公式コントラクトを使用','Use official contracts'),b('公式Aqua Coreをローカル配置','Official Aqua core deployed locally'),b('推奨するcontract / SDKの版','Preferred contract / SDK pair')],
   [b('実TXを伴う最終デモ','Final demo with token transfers'),b('Anvilでテストtokenを実移動','Actual test-token transfers on Anvil'),b('新規Anvil配置の扱い ※','Does a fresh Anvil deployment qualify? *')],
   [b('開発履歴を提示','Meaningful development history'),b('複数commitの履歴がある','Multi-commit history is present'),b('既存研究と今回追加分の扱い','How to present earlier and event work')],
   [b('SwapVM利用は評価上優遇','SwapVM receives scoring preference'),b('SwapVMは未導入','SwapVM is not integrated'),b('既存命令への移行を優先するか','Prioritize an existing-instruction route?')],
  ],[3.68,4.05,4.4],{rh:.68,font:13.5});
  small(b('※ 公式はlocal forksを許容。新規配置との同一視は避け、実行環境を確認する。','* The page allows local forks. Confirm whether a fresh local deployment meets that condition.'),.67,6.28,12,.4);
  small(b('通常枠 $5,000 / Continuity枠 $2,000。参加トラック・適格性は主催者へ確認。','Main pool: $5,000 / Continuity pool: $2,000. Confirm track and eligibility with the organizers.'),.67,6.71,12,.32);
 }
 if(s.kind==='architecture'){
  label(b('OFFCHAIN / 学習と判断','OFFCHAIN / LEARNING AND CONTROL'),.7,2.23,11);
  const blocks=[
   [b('市場の観測','Market observation'),b('保存済みUniswap履歴\n16本の人工入力','Recorded Uniswap history\n16 engineered inputs')],
   [b('固定グラフ','Fixed neural graph'),b('166,700神経\n25,582,938接続','166,700 neurons\n25,582,938 edges')],
   [b('学習readout','Learned readout'),b('30bps / 800bps\nまたは撤回','30 bps / 800 bps\nor withdrawal')],
   [b('maker制御器','Maker controller'),b('SDK → calldata\nローカルwalletが送信','SDK → calldata\nLocal wallet sends TXs')],
  ];
  blocks.forEach(([a,bb],j)=>{tile(.6+j*3.1,2.72,2.83,2.3,a,bb,[C.blue,C.blue,C.teal,C.teal][j],13.3);if(j<3)arrow(3.44+j*3.1,3.64,.25);});
  text('↓',11.11,5.05,.5,.43,22,C.teal,true,{align:'center'});
  rect(.6,5.59,12.13,.59,C.ink);text(b('ONCHAIN  /  Status registry  →  Aqua ship / dock  →  AquaFlyApp swap  →  token残高','ONCHAIN  /  Status registry  →  Aqua ship / dock  →  AquaFlyApp swap  →  token balances'),.84,5.76,11.65,.36,14,C.white,true);
  note(b('学習対象はreadout。神経グラフは固定。policyHashは計算結果の正しさを証明しない。','Only the readout learns; the graph stays fixed. A policy hash does not prove correct execution.'));
 }
 if(s.kind==='lifecycle'){
  const xs=[b('1 / 状態を確定','1 / Confirm state'),b('2 / 古い戦略をdock','2 / Dock old strategy'),b('3 / 新しい戦略をship','3 / Ship new strategy'),b('4 / takerがswap','4 / Taker swaps'),b('5 / 残高・receipt','5 / Inspect outcome')];
  const ds=[b('新revisionのTX後は\n古いrevisionを拒否','Old revisions rejected\nafter the new Status TX'),b('旧hashを無効化\ntokenは移動しない','Invalidate the old hash\nNo token movement'),b('撤回時はshipしない\ntokenは移動しない','Skip when withdrawing\nNo token movement'),b('人工の受入ルールで\n1 tokenの約定','Simulated acceptance\nOne-token fill'),b('実際の差額とTXを\n画面で追跡','Trace actual balance\nchanges and TXs')];
  xs.forEach((h,j)=>{const x=.6+j*2.48;rect(x,2.36,2.22,1.9);text(h,x+.16,2.59,1.9,.66,lang==='ja'?15:14,C.blue,true);text(ds[j],x+.16,3.32,1.91,.78,12.3);if(j<4)arrow(x+2.23,3.07,.24);});
  label(b('約定中のtokenの流れ','TOKEN FLOW DURING A FILL'),.8,4.64,9);
  text('taker → AquaFlyApp → Aqua.push → maker',.83,5.13,11.7,.46,22,C.teal,true);
  text('maker → Aqua.pull → taker',.83,5.7,11.7,.46,22,C.teal,true);
  note(b('1回のswapは原子的。Status → dock → ship → swapは別TXで、全体が1回の原子的更新ではない。','Each swap is atomic. Status, dock, ship and swap are separate transactions.'));
 }
 if(s.kind==='inventory'){
  rect(.6,2.38,5.59,3.72);label(b('現在 / 初期状態','CURRENT / INITIAL STATE'),.85,2.63,5);
  rect(.86,3.12,5.05,1.04,C.pale);text(b('maker実残高：500 / token','Maker balance: 500 / token'),1.04,3.41,4.7,.5,22,C.teal,true);
  ['MOMO','SORA'].forEach((name,j)=>{rect(.86+j*2.61,4.55,2.43,1.12,'EAF0F6');text(name,1.02+j*2.61,4.73,2.1,.3,14,C.blue,true);text('100 / token',1.02+j*2.61,5.15,2.1,.3,14);});
  tile(6.49,2.38,6.24,3.72,b('次に追加する候補','PROPOSED NEXT INPUTS'),b('残高・allowance・戦略の合計提示額を観測。\n片方の約定で、次の提示や撤回を変える。\n固定の数量上限と、学習の役割を分ける。','Observe balance, allowance and aggregate offers.\nAfter one fill, adjust the next offer or withdrawal.\nSeparate fixed quantity limits from learning.'),C.amber,17);
  note(b('初期提示は合計200 / token。共有walletへの接続はあるが、資金不足下の協調は未実証。','Initial total offer: 200 / token. Shared-wallet wiring is shown; scarce-inventory coordination is unproven.'));
 }
 if(s.kind==='evidence'){
  rect(.6,2.3,7.36,4.43,C.white,C.line);els.push({type:'image',src:path.join(out,'assets/aqua-full-gui.png'),x:.63,y:2.33,w:7.3,h:4.37,crop:{x:124,y:360,w:1195,h:715}});
  const d=evidence.gui['aqua:full'];
  label(b('累積報酬 / 代理評価','CUMULATIVE REWARD / PROXY'),8.22,2.32,4.5);
  table(['',b('旧方策','Old'),b('候補','Candidate'),b('別条件','Next')],['MOMO','SORA'].map((n,j)=>[n,d.before[j].toFixed(3),d.after[j].toFixed(3),d.test[j].toFixed(3)]),[1.16,1.04,1.16,1.16],{x:8.21,y:2.79,rh:.52,font:11.5,headH:.44});
  text(b('両個体がv2を採用','Both adopted v2'),8.23,4.58,4.4,.45,21,C.teal,true);
  text(b('後続判断・再起動後の使用を確認。\n報酬は代理価格によるテスト交換の評価。\n実LP利益や全神経の優位は未実証。','Used in later decisions and after restart.\nReward values test fills at a proxy price.\nReal LP profit and full-model superiority are unproven.'),8.25,5.24,4.35,1.44,14);
  small(b('保存済み画面（英語UI）。数値は同梱した受入JSONから作成。','Saved English GUI. Figures are generated from the included acceptance JSON.'),.67,6.8,12,.3);
 }
 if(s.kind==='options'){
  table([b('経路','Path'),b('作るもの','What changes'),b('判断材料','Decision point')],[
   [b('A / 独自AquaAppを継続','A / Keep the custom AquaApp'),b('独自価格・状態連動を拡張\n既存デモの説明と検証を改善','Extend custom pricing / state checks\nStrengthen current demo evidence'),b('独自App自体が見たい価値か\nrouter接続要件は何か','Is the custom app the desired value?\nWhat router compatibility is needed?')],
   [b('B / 既存SwapVM命令','B / Existing SwapVM instructions'),b('既存命令で戦略を構成\nBioAgentが選択・更新する','Compose a strategy from existing instructions\nBioAgent selects and updates it'),b('第一候補として相談\n必要な価格・数量制御を表せるか','First option for discussion\nCan it express the required controls?')],
   [b('C / 独自の拡張','C / Custom extension'),b('必要な場合に独自命令等を追加\nExtruction等の経路も確認','Add custom logic if required\nDiscuss routes such as Extruction'),b('既存命令では足りない理由を特定\n検証・配置範囲を合意','Name the gap in existing instructions\nAgree on validation and deployment scope')],
  ],[3.33,4.53,4.27],{rh:1.13,font:14});
  note(b('対応するrouter・opcode・SDKの版を揃える。現時点で移行先の版や独自opcodeは未決定。','Align router, opcode and SDK versions. No target release or custom opcode has been selected.'));
 }
 if(s.kind==='story'){
  const heads=[b('01 / 準備','01 / Set up'),b('02 / 約定','02 / Fill'),b('03 / 判断','03 / Decide'),b('04 / 更新','04 / Update'),b('05 / 比較','05 / Compare')];
  const bodies=[b('1 walletで\n複数戦略を支える','Back multiple strategies\nwith one wallet'),b('一方を約定し\n在庫を変える','Fill one strategy\nand change inventory'),b('在庫＋市場入力から\n行動を選ぶ','Choose an action from\ninventory + market'),b('提示・数量・撤回を\n戦略へ反映','Reflect offer, size or\nwithdrawal in strategy'),b('固定方策と\n同条件で比較','Compare against a fixed\npolicy under equal conditions')];
  heads.forEach((h,j)=>{const x=.6+j*2.48;tile(x,2.56,2.22,2.73,h,bodies[j],j===2?C.teal:C.blue,13.3);if(j<4)arrow(x+2.23,3.58,.24);});
  rect(.6,5.64,12.13,.58,C.ink);text(b('画面で追う：在庫 → 観測 → action / policyHash → strategyHash → TX → 新しい在庫','Visible trail: inventory → observation → action / policyHash → strategyHash → TX → new inventory'),.82,5.82,11.7,.32,13,C.white,true);
  note(b('次のデモ案。共有在庫入力、数量制御、同条件の比較はこれから実装・確認する。','Proposed demo. Shared-inventory inputs, size control and the matched comparison still need implementation.'));
 }
 if(s.kind==='acceptance'){
  const rows=[
   [b('1 / Protocolを実際に使う','1 / Execute through the protocol'),b('合意したcontractとSDKで戦略を登録。\n選択した経路をTX・アドレスで追える。','Register a strategy using the agreed contract and SDK.\nTrace the selected route through addresses and TXs.')],
   [b('2 / 在庫の変化を追える','2 / Show inventory changing'),b('同じmaker資金を複数戦略で使う。\n約定の前後で実残高と仮想提示を表示。','Use one maker wallet across multiple strategies.\nDisplay balances and virtual offers before and after a fill.')],
   [b('3 / 失敗と撤回を示す','3 / Show failure and withdrawal'),b('古い戦略・撤回・残高不足を再現。\n状態と残高の期待結果を事前に決める。','Exercise stale strategies, withdrawal and insufficient funds.\nAgree on the expected state and balance outcomes.')],
   [b('4 / 学習の寄与を切り分ける','4 / Isolate the learned contribution'),b('方策版と行動変化を追跡する。\n固定方策と同じ条件で比較し、差を報告。','Trace policy versions and changed actions.\nCompare with a fixed policy under the same conditions.')],
  ];
  rows.forEach(([h,bb],j)=>tile(.6+(j%2)*6.21,2.32+Math.floor(j/2)*2.05,5.92,1.87,h,bb,j<2?C.blue:C.teal,13.5));
  note(b('数値目標・期限は未合意。まず「画面とTXで何が分かればよいか」を決める。','Targets and dates are pending. First agree on what the screen and transactions should demonstrate.'),6.59);
 }
 if(s.kind==='questions'){
  questions.forEach((q,j)=>{const y=2.23+j*.87;rect(.6,y,.49,.49,j<3?C.blue:C.teal);text(String(j+1),.6,y+.12,.49,.3,13,C.white,true,{align:'center'});text(q,1.3,y+.03,11.22,.7,lang==='ja'?17:16);if(j<4)line(1.3,y+.73,12.72,y+.73);});
 }
 if(s.kind==='decision'){
  decisionFields.forEach((f,j)=>{const y=2.17+j*.65;text(f,.7,y,lang==='ja'?5.2:5.8,.5,lang==='ja'?15:13.4,C.ink,true);line(lang==='ja'?6:6.65,y+.48,12.7,y+.48,C.line,1.2);});
 }
 if(s.kind==='appendix'){
  const rows=[
   [b('更新の頻度と原子性','Update frequency and atomicity'),b('現状は各tickでStatus → dock → ship。\n同じ行動でもTXを更新。cooldownは未実装。','Current ticks repeat Status → dock → ship.\nEven unchanged actions create TXs; no cooldown.')],
   [b('Stopと戦略撤回は別','Stopping and docking differ'),b('GUIのStopは実験ループを止める。\n稼働中の全戦略を自動dockする処理はない。','GUI Stop cancels the experiment loop.\nIt does not automatically dock every active strategy.')],
   [b('価格・quote・taker経路','Pricing, quoting and taker flow'),b('現状は人工1:1価格とローカルtaker。\nquote API・公開router互換性は未実装。','Current pricing is artificial 1:1 with a local taker.\nNo quote API or public-router compatibility yet.')],
   [b('version・アクセス・配布条件','Versions, access and distribution'),b('対応するSDK / routerとtaker経路を確認。\nAquaの帰属表示・ライセンス条件を保持。','Confirm the SDK / router pair and taker access.\nRetain Aqua attribution and license notices.')],
  ];
  rows.forEach(([h,bb],j)=>tile(.6+(j%2)*6.21,2.3+Math.floor(j/2)*2.12,5.92,1.95,h,bb,j<2?C.amber:C.blue,13.5));
  small(b('本番dAppのアクセス条件は配備経路ごとに確認。ローカルcustom appと同一視しない。','Check deployed dApp access per route; do not assume the same conditions as the local custom app.'),.7,6.7,12,.31);
 }
 if(s.kind==='sources'){
  const groups=[
   ['P',b('イベント要件と評価観点','Event requirements and scoring'),'ethglobal.com/events/tokyo2026/prizes/1inch',sources.P.url],
   ['O / R',b('Aquaの概念・Appの作成経路','Aqua concepts and app authoring paths'),'Official Aqua documentation / Overview · Build an AquaApp',sources.R.url],
   ['G / T',b('maker自動化・アクセス条件','Maker automation and access'),'Official Aqua documentation / Agentic Liquidity · Access',sources.G.url],
   ['C / A / S',b('現行の統合とコントラクト','Current integration and contract'),'services/full-apps/{chain,aqua}.mjs · contracts/src/AquaFlyApp.sol'],
   ['E / V',b('保存済み受入・動画検証','Recorded acceptance and video validation'),'docs/submission/evidence/full-apps-acceptance.json · full-app-demos-20260926/'],
   ['L / N / F',b('ライセンス・学習回路・停止処理','License, neural runtime and stopping'),'contracts/vendor/README.md · packages/bio_agent/full_apps · services/full-apps'],
  ];
  groups.forEach(([key,h,body,url],j)=>{const y=2.14+j*.71;label(key,.7,y,1.5);text(h,2.1,y,10.5,.33,15,C.ink,true);text(body,2.1,y+.34,10.5,.31,10.8,url?C.blue:C.muted,false,url?{url}:{});});
  small(b('詳細URL・発表者ノート・想定問答・打ち合わせシートを同梱。実験の再実行はしていない。','Full source links, notes, Q&A and a meeting worksheet are included. Experiments were not rerun.'),.7,6.68,12,.32);
 }
 line(.6,7.13,12.73,7.13,C.line,.7);
 text('BIOAGENT  /  2026.09.26',.6,7.24,2.3,.2,8,C.muted,true);
 text('SOURCES '+s.refs.join(' · '),3,7.24,4.65,.2,8,C.muted);
 text('Powered by Aqua — © Degensoft Ltd 2025',7.71,7.24,3.65,.2,8,C.muted);
 text(`${String(i+1).padStart(2,'0')} / ${slides.length}`,11.77,7.2,.97,.27,10,C.blue,true,{align:'right'});
 return els;
}

const imageCache=new Map();
async function imageData(src){if(!imageCache.has(src)){const buf=await fs.readFile(src);imageCache.set(src,{data:'data:image/png;base64,'+buf.toString('base64'),w:buf.readUInt32BE(16),h:buf.readUInt32BE(20)});}return imageCache.get(src);}
function notesFor(s,lang,i){return `${i+1}. ${tv(s.title,lang).replaceAll('\n',' ')}\n\n${tv(s.notes,lang)}\n\n${lang==='ja'?'出典':'Sources'}\n`+s.refs.map(k=>`[${k}] ${sources[k].path||sources[k].url}`).join('\n');}
async function htmlElement(e){
 const base=`left:${e.x*96}px;top:${e.y*96}px;width:${e.w*96}px;height:${e.h*96}px;`;
 if(e.type==='text'){const inner=e.url?`<a href="${esc(e.url)}">${esc(e.text)}</a>`:esc(e.text);return `<div class="txt" style="${base}font-size:${e.size*96/72}px;color:#${e.color};font-weight:${e.bold?700:400};text-align:${e.align||'left'}">${inner}</div>`;}
 if(e.type==='rect')return `<div class="shape" style="${base}background:#${e.fill};${e.stroke?'border:1px solid #'+e.stroke:''}"></div>`;
 if(e.type==='line'){const x=Math.min(e.x,e.x2),y=Math.min(e.y,e.y2),w=Math.abs(e.x2-e.x),h=Math.abs(e.y2-e.y);return `<svg class="shape" style="left:${x*96}px;top:${y*96}px;width:${Math.max(w*96,2)}px;height:${Math.max(h*96,2)}px;overflow:visible"><line x1="${(e.x-x)*96}" y1="${(e.y-y)*96}" x2="${(e.x2-x)*96}" y2="${(e.y2-y)*96}" stroke="#${e.color}" stroke-width="${e.width*96/72}"/></svg>`;}
 if(e.type==='image'){const im=await imageData(e.src);if(e.crop){const q=e.crop,sx=e.w*96/q.w,sy=e.h*96/q.h;return `<div class="image" style="${base}overflow:hidden"><img alt="Recorded Aqua acceptance GUI" src="${im.data}" style="position:absolute;max-width:none;left:${-q.x*sx}px;top:${-q.y*sy}px;width:${im.w*sx}px;height:${im.h*sy}px"></div>`;}return `<img class="image" alt="Evidence" src="${im.data}" style="${base}object-fit:contain">`;}
}
function runtimeScript(){return `const pages=[...document.querySelectorAll('.slide')];let current=0,notes=false;function move(n){current=Math.max(0,Math.min(pages.length-1,n));pages[current].scrollIntoView({behavior:'instant',block:'start'});document.querySelector('#count').textContent=(current+1)+' / '+pages.length;document.querySelector('#notes').textContent=pages[current].dataset.notes;}document.addEventListener('keydown',e=>{if(['ArrowRight','PageDown',' '].includes(e.key)){e.preventDefault();move(current+1)}if(['ArrowLeft','PageUp'].includes(e.key)){e.preventDefault();move(current-1)}if(e.key.toLowerCase()==='n'){notes=!notes;document.body.classList.toggle('show-notes',notes)}});document.querySelector('#prev').onclick=()=>move(current-1);document.querySelector('#next').onclick=()=>move(current+1);document.querySelector('#toggle').onclick=()=>{notes=!notes;document.body.classList.toggle('show-notes',notes)};function resize(){const scale=Math.min(1,(innerWidth-28)/1280);document.documentElement.style.setProperty('--scale',scale);document.documentElement.style.setProperty('--page-height',(720*scale)+'px')};addEventListener('resize',resize);resize();move(0);`;}

for(const lang of ['ja','en']){
 const pptx=new PptxGenJS();pptx.defineLayout({name:'AQUA_WIDE',width:W,height:H});pptx.layout='AQUA_WIDE';pptx.author='BioAgent project';pptx.company='BioAgent';pptx.subject='Current Aqua usage and next-demo alignment';pptx.title=lang==='ja'?'BioAgent × Aqua — 次のデモを決める':'BioAgent × Aqua — Align on the next demo';pptx.lang=lang==='ja'?'ja-JP':'en-US';pptx.theme={headFontFace:'Yu Gothic',bodyFontFace:'Yu Gothic',lang:pptx.lang};
 scenes[lang]=[];const pages=[];let study=`# ${pptx.title}\n\n2026-09-26 · 14 slides · Discussion draft\n\n`;
 for(const [i,s] of slides.entries()){
  const els=scene(s,i,lang);scenes[lang].push(els);const sl=pptx.addSlide();sl.background={color:C.bg};
  for(const e of els){
   if(e.type==='text')sl.addText(e.text,{x:e.x,y:e.y,w:e.w,h:e.h,fontFace:'Yu Gothic',fontSize:e.size,color:e.color,bold:e.bold,margin:0,valign:'top',align:e.align||'left',paraSpaceAfter:0,lineSpacingMultiple:1.2,wrap:true,...(e.url?{hyperlink:{url:e.url}}:{})});
   else if(e.type==='rect')sl.addShape(pptx.ShapeType.rect,{x:e.x,y:e.y,w:e.w,h:e.h,fill:{color:e.fill},line:{color:e.stroke||e.fill,width:e.stroke?.7:0,transparency:e.stroke?0:100}});
   else if(e.type==='line')sl.addShape(pptx.ShapeType.line,{x:Math.min(e.x,e.x2),y:Math.min(e.y,e.y2),w:Math.abs(e.x2-e.x),h:Math.abs(e.y2-e.y),flipV:(e.x2-e.x)*(e.y2-e.y)<0,line:{color:e.color,width:e.width}});
   else if(e.type==='image'){const im=await imageData(e.src),q=e.crop;if(q)sl.addImage({data:im.data,x:e.x,y:e.y,w:im.w*e.w/q.w,h:im.h*e.h/q.h,sizing:{type:'crop',x:q.x*e.w/q.w,y:q.y*e.h/q.h,w:e.w,h:e.h}});else sl.addImage({data:im.data,x:e.x,y:e.y,w:e.w,h:e.h,sizing:{type:'contain',w:e.w,h:e.h}});}
  }
  const notes=notesFor(s,lang,i);sl.addNotes(notes);pages.push(`<section class="page"><article class="slide" id="slide-${i+1}" data-notes="${esc(notes)}">${(await Promise.all(els.map(htmlElement))).join('')}</article></section>`);
  study+=`## ${i+1}. ${tv(s.title,lang).replaceAll('\n',' ')}\n\n${tv(s.notes,lang)}\n\n${lang==='ja'?'参照':'Sources'}: ${s.refs.map(k=>`[${k}] ${sources[k].path||sources[k].url}`).join(' · ')}\n\n`;
 }
 const html=`<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(pptx.title)}</title><style>*{box-sizing:border-box}body{margin:0;background:#203448;font-family:'Yu Gothic','Noto Sans CJK JP',sans-serif}.page{width:calc(1280px * var(--scale,1));height:var(--page-height,720px);margin:20px auto 38px;position:relative}.slide{width:1280px;height:720px;position:absolute;top:0;left:0;background:#${C.bg};overflow:hidden;transform:scale(var(--scale,1));transform-origin:top left}.txt,.shape,.image{position:absolute}.txt{white-space:pre-line;line-height:1.2;word-break:normal;overflow-wrap:normal}.txt a{color:inherit;text-decoration:none}nav{position:fixed;z-index:10;right:18px;bottom:16px;background:#10273e;color:white;padding:9px 14px;border-radius:8px;display:flex;align-items:center;gap:10px;font:13px sans-serif}nav a{color:#9ee1e7}button{background:#fff;border:0;padding:7px 10px;border-radius:4px;cursor:pointer}#notes{display:none;position:fixed;left:20px;right:20px;bottom:70px;max-height:230px;overflow:auto;background:#fff9eb;padding:18px;white-space:pre-wrap;font-size:15px;line-height:1.55;z-index:8}.show-notes #notes{display:block}@page{size:13.333333in 7.5in;margin:0}@media print{body{background:white}.page{width:1280px;height:720px;margin:0;break-after:page;page-break-after:always}.page:last-of-type{break-after:auto;page-break-after:auto}.slide{transform:none}nav,#notes{display:none!important}}</style></head><body>${pages.join('')}<aside id="notes"></aside><nav><a href="index.html">JA / EN</a><button id="prev">←</button><span id="count"></span><button id="next">→</button><button id="toggle">${lang==='ja'?'発表者ノート (N)':'Notes (N)'}</button><a href="Aqua-meeting-${lang}.pptx">PPTX</a><a href="Aqua-meeting-${lang}.pdf">PDF</a></nav><script>${runtimeScript()}</script></body></html>`;
 await fs.writeFile(path.join(out,`Aqua-meeting-${lang}.html`),html);await fs.writeFile(path.join(out,`speaker-notes-${lang}.md`),study);await pptx.writeFile({fileName:path.join(out,`Aqua-meeting-${lang}.pptx`)});
}
await fs.writeFile(path.join(out,'scene-manifest.json'),JSON.stringify({slides:slides.length,languages:['ja','en'],scenes},null,2));
await fs.writeFile(path.join(out,'sources.md'),'# Sources / 根拠\n\nReviewed 2026-09-26. Official documentation does not establish team preferences.\n\n'+Object.entries(sources).map(([k,v])=>`- [${k}] **${v.title}** — ${v.url?`[Official source](${v.url})`:v.path}. ${v.kind}.`).join('\n')+'\n\nAqua source pinned at ef24220ed9647555727b06867bf509cd6959d84b.\nPowered by Aqua — © Degensoft Ltd 2025.\nMaleCNS data: FlyEM / HHMI Janelia, Cambridge, MRC LMB, Google; CC-BY-4.0.\n');
console.log(JSON.stringify({out,slides:slides.length,languages:['ja','en']}));
