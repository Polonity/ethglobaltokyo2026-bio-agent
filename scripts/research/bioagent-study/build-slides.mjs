import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {chromium} from '@playwright/test';
const require=createRequire(import.meta.url);
const PptxGenJS=require('/mnt/c/Users/hiken/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/pptxgenjs');
const out=path.resolve('artifacts/bioagent-study-20260926');
const report=await fs.readFile(path.join(out,'findings-ja-en.md'),'utf8');
const b=(ja,en)=>({ja,en}),langValue=(v,l)=>typeof v==='object'?v[l]:v;
const slides=[
 {tag:b('01 / 学習を試し、効果を測る','01 / TRAIN, THEN MEASURE THE EFFECT'),
 title:b('学習は、成果と副作用で評価する','Evaluate learning through outcomes and side effects'),
 lead:b('採餌・模擬市場・Aquaで、学習前後を比較した。','We compared before and after learning in foraging, a synthetic market and Aqua.'),
 cards:[
  {label:b('軽量採餌：5回学習','SMALL FORAGING MODEL / 5 ROUNDS'),big:b('採餌 +39%\n接触 +56%','Food +39%\nContacts +56%'),body:b('総合報酬は悪化。\n5つの学習seedで確認。','Overall reward got worse.\nFive training seeds.'),color:'A15F20'},
  {label:b('模擬市場：条件で結果が逆転','SYNTHETIC MARKET / REGIME MATTERS'),big:b('下落では損失減\n上昇では悪化','Less loss in declines;\nworse in uptrends'),body:b('全条件で平均PnLは負。\n実市場の収益性は未検証。','All mean PnLs stayed negative.\nReal-market performance untested.'),color:'315B9E'},
  {label:b('Aqua：人工目標の校正','AQUA / ARTIFICIAL-TARGET CALIBRATION'),big:b('誤差は改善\n既知の式は誤差0','Calibration improved;\nknown rule: zero error'),body:b('この目標では、生物由来回路が\n必要だとは示せなかった。','This target did not establish\na need for a biological circuit.'),color:'087E74'}
 ],
 foot:b('全神経版も検証：166,700神経・3学習seed、候補採用1/6。生物由来の性能優位は未証明。','Full model also tested: 166,700 neurons, 3 training seeds, 1/6 candidates adopted. Biological superiority remains unproven.'),
 notes:b('採餌・模擬市場・Aquaで学習を試しました。採餌は餌も接触も増え、模擬市場は相場条件で改善と悪化が逆転しました。Aquaの人工目標では既知の式が最良でした。学習は成果と副作用の両方で評価する必要があります。','Across foraging, a synthetic market and Aqua, we found mixed learning effects. More food also meant more collisions. Market losses changed by regime. Aqua’s artificial target was solved exactly by its defining rule.'),
 refs:'light-foraging.json / market.json / aqua.json / full-foraging.json'},
 {tag:b('02 / 共通化が役立った部分','02 / WHERE SHARED INTERFACES HELPED'),
 title:b('共通の個体と入力を、複数の実装で扱う','Use shared identity and inputs across implementations'),
 lead:b('入力の有効性と、学習成果の再利用を実行して確かめた。','We exercised shared input validity and reusable learning artifacts.'),
 cards:[
  {label:b('入力の更新を共有','SHARED INPUT REVISION'),big:b('1回の更新\n→ 2契約が拒否','1 update\n→ 2 contracts reject'),body:b('古い入力に基づく戦略を拒否。\n別個体の戦略は有効なまま。','Old-revision strategies became invalid.\nAnother individual remained usable.'),color:'087E74'},
  {label:b('学習成果を再利用','REUSE LEARNED ARTIFACTS'),big:b('24,300個体ステップ\n復元後も一致','24,300 agent steps\nmatch after restore'),body:b('市場の判断・残高を再現。\n追加学習0、共通の保存API。','Market decisions and balances matched.\nZero retraining; shared save/load API.'),color:'315B9E'},
  {label:b('入力アダプターを共通制御','ONE LOOP FOR INPUT ADAPTERS'),big:b('3入力アダプター\n1つの実行ループ','3 input adapters\n1 execution loop'),body:b('観測 → 実行 → 表示。\n同じ採餌エンジンを利用。','Observe → step → snapshot.\nAll wrap the same foraging engine.'),color:'087E74'}
 ],
 foot:b('隔離EVMとオフライン実験。Solidity IBioAgentは入力契約、JavaScriptの基底クラスとは別。','Isolated EVM and offline experiments. Solidity IBioAgent is an input interface, separate from the JavaScript base class.'),
 notes:b('共通入力を一度更新すると、2つの契約が古い戦略を拒否しました。採餌と市場で同じ保存APIを使い、市場では再学習なしに2万4300個体ステップの判断と残高を再現できました。','Shared interfaces had concrete benefits: one input update invalidated stale strategies in two contracts. Saved market policies reproduced 24,300 agent steps without retraining.'),
 refs:'evm.json / market.json / interfaces.json'},
 {tag:b('03 / 実験から仕様へ','03 / TURN FINDINGS INTO REQUIREMENTS'),
 title:b('失敗から、共通仕様の要件が具体化した','Failures made the shared specification more concrete'),
 lead:b('共有環境が二重に進む問題も発見。学びを3つの要件へ。','We also found double stepping in a shared world. Three requirements follow.'),
 cards:[
  {label:b('効果の定義','DEFINE USEFUL IMPROVEMENT'),big:b('成果と副作用で\n採用を判定','Adopt using outcomes\nand constraints'),body:b('学習・評価・採用を分ける。\n厳しいゲートは改善も止め得る。','Separate training, evaluation and adoption.\nStrict gates can also block progress.'),color:'A15F20'},
  {label:b('適用範囲の定義','DEFINE ARTIFACT COMPATIBILITY'),big:b('モデル・個体・用途を\n成果物に結び付ける','Bind artifacts to\nmodel, agent and task'),body:b('再利用と、別用途への技能転移を\n区別して記録する。','Distinguish reuse within a task\nfrom skill transfer between tasks.'),color:'315B9E'},
  {label:b('実行責務の定義','DEFINE CLOCK OWNERSHIP'),big:b('共有環境は\n1tickに1回進める','Advance a shared world\nonce per tick'),body:b('個体ごとのstepでは二重進行。\n環境の実行管理を分離する。','Per-agent stepping advanced it twice.\nGive the environment its own scheduler.'),color:'087E74'}
 ],
 foot:b('結論：限定実装で再利用と制御の効用を確認。成功・失敗を再現できる検証基盤と仕様要件が成果。','Conclusion: verified limited reuse and control benefits. Our contribution is a reproducible testbed and evidence-based requirements.'),
 notes:b('共有環境を二重に進める問題も見つかりました。ここから、学習の採用条件、成果物の適用範囲、環境の時計を仕様の要件にしました。成功と失敗を再現できるBioAgentの検証基盤が、今回の成果です。','We also found double stepping when agents shared a world. These results define our specification: explicit adoption criteria, artifact compatibility, and one environment clock. We built a reproducible research testbed; biological performance superiority remains unproven.'),
 refs:'interfaces.json / spec-requirements-ja-en.md'}
];
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const validation={createdAt:new Date().toISOString(),languages:{}};
const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--allow-file-access-from-files']});
try{
for(const lang of ['ja','en']){
 const pptx=new PptxGenJS();pptx.defineLayout({name:'WIDE',width:13.333333,height:7.5});pptx.layout='WIDE';pptx.title='BioAgent research: effects and shared interfaces';pptx.author='BioAgent project';pptx.lang=lang==='ja'?'ja-JP':'en-US';pptx.theme={headFontFace:'Yu Gothic',bodyFontFace:'Yu Gothic',lang:pptx.lang};
 const htmlSlides=[],notes=[];
 for(const [i,s] of slides.entries()){
  const t=v=>langValue(v,lang),els=[];
  const rect=(x,y,w,h,color)=>els.push({type:'rect',x,y,w,h,color});
  const text=(value,x,y,w,h,size,color='25323D',bold=false)=>els.push({type:'text',text:t(value),x,y,w,h,size,color,bold});
  rect(0,0,13.333333,7.5,'F5F7F8');rect(.52,.40,.43,.05,'087E74');text(s.tag,1.13,.29,11.8,.35,12,'087E74',true);
  text(s.title,.55,1.00,12.25,1.05,lang==='ja'?31:30,'25323D',true);text(s.lead,.58,2.04,12.1,.52,17,'576671');
  s.cards.forEach((card,j)=>{const x=.55+j*4.16;rect(x,2.95,3.9,3.28,'FFFFFF');rect(x,2.95,3.9,.045,card.color);text(card.label,x+.2,3.2,3.5,.56,lang==='ja'?13:10.8,card.color,true);text(card.big,x+.2,4.02,3.5,1.02,lang==='ja'?22:19.5,card.color,true);text(card.body,x+.2,5.36,3.5,.65,lang==='ja'?13.3:11.6);});
  rect(.55,6.52,12.23,.55,'E0EEEB');text(s.foot,.75,6.66,11.82,.35,lang==='ja'?11.5:10.3,'204A45');
  text('BIOAGENT / RESEARCH / 2026.09.26',.55,7.28,3.7,.18,8,'576671',true);text(s.refs,4.35,7.28,7.8,.18,7.5,'576671');text(`${i+1} / 3`,12.3,7.26,.6,.2,9,'087E74',true);
  const slide=pptx.addSlide();slide.background={color:'F5F7F8'};
  for(const e of els){if(e.type==='rect')slide.addShape(pptx.ShapeType.rect,{x:e.x,y:e.y,w:e.w,h:e.h,fill:{color:e.color},line:{transparency:100}});else slide.addText(e.text,{x:e.x,y:e.y,w:e.w,h:e.h,fontFace:'Yu Gothic',fontSize:e.size,color:e.color,bold:e.bold,margin:0,valign:'top',lineSpacingMultiple:1.17});}
  const note=t(s.notes)+'\n\nSources: '+s.refs+'\n\n'+report;slide.addNotes(note);notes.push(t(s.notes));
  const html=els.map(e=>e.type==='rect'?`<div class="shape" style="left:${e.x*96}px;top:${e.y*96}px;width:${e.w*96}px;height:${e.h*96}px;background:#${e.color}"></div>`:`<div class="txt" style="left:${e.x*96}px;top:${e.y*96}px;width:${e.w*96}px;height:${e.h*96}px;font-size:${e.size*96/72}px;color:#${e.color};font-weight:${e.bold?700:400}">${esc(e.text)}</div>`).join('');
  htmlSlides.push(`<section class="page"><article class="slide" id="slide-${i+1}" data-notes="${esc(t(s.notes))}">${html}</article></section>`);
 }
 const base=path.join(out,`BioAgent-research-${lang}`);await pptx.writeFile({fileName:base+'.pptx'});
 await fs.writeFile(path.join(out,`speaker-script-${lang}.md`),notes.join('\n\n')+'\n');
 const html=`<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>BioAgent research / ${lang}</title><style>*{box-sizing:border-box}body{margin:0;background:#273943;font-family:'Yu Gothic','Noto Sans CJK JP',sans-serif}.page{width:calc(1280px * var(--scale,1));height:calc(720px * var(--scale,1));position:relative;margin:20px auto 40px}.slide{width:1280px;height:720px;position:absolute;background:#F5F7F8;transform:scale(var(--scale,1));transform-origin:top left}.txt,.shape{position:absolute}.txt{line-height:1.17;white-space:pre-line}nav{position:fixed;right:16px;bottom:16px;padding:12px;background:#122935;color:white;z-index:3;font:14px sans-serif}nav a{color:#B3EBDF;margin:0 10px}button{padding:7px;margin:0 7px;cursor:pointer}#notes{display:none;position:fixed;left:20px;right:20px;bottom:75px;padding:20px;background:white;z-index:2;line-height:1.6}@page{size:13.333333in 7.5in;margin:0}@media print{body{background:white}.page{width:1280px;height:720px;margin:0;break-after:page}.page:last-of-type{break-after:auto}.slide{transform:none}nav,#notes{display:none!important}}</style></head><body>${htmlSlides.join('')}<aside id="notes"></aside><nav><a href="BioAgent-research-ja.html">JA</a><a href="BioAgent-research-en.html">EN</a><button id="prev">←</button><span id="count"></span><button id="next">→</button><button id="show-notes">Notes</button><a href="BioAgent-research-${lang}.pdf">PDF</a><a href="BioAgent-research-${lang}.pptx">PPTX</a><a href="findings-ja-en.md">Q&A</a></nav><script>const pages=[...document.querySelectorAll('.slide')];let current=0;function go(i){current=Math.max(0,Math.min(2,i));pages[current].scrollIntoView({block:'start'});document.querySelector('#count').textContent=(current+1)+' / 3';document.querySelector('#notes').textContent=pages[current].dataset.notes}document.querySelector('#prev').onclick=()=>go(current-1);document.querySelector('#next').onclick=()=>go(current+1);document.querySelector('#show-notes').onclick=()=>{const n=document.querySelector('#notes');n.style.display=n.style.display==='block'?'none':'block'};document.addEventListener('keydown',e=>{if(e.key==='ArrowRight')go(current+1);if(e.key==='ArrowLeft')go(current-1)});function resize(){document.documentElement.style.setProperty('--scale',Math.min(1,(innerWidth-28)/1280))}window.addEventListener('resize',resize);resize();go(0);</script></body></html>`;
 await fs.writeFile(base+'.html',html);
 const page=await browser.newPage({viewport:{width:1330,height:800}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(pathToFileURL(base+'.html').href);await page.evaluate(()=>document.fonts.ready);
 await page.locator('#next').click();const navigation=await page.locator('#count').innerText()==='2 / 3';await page.locator('#show-notes').click();const notesVisible=await page.locator('#notes').isVisible();await page.locator('#show-notes').click();
 const overflow=await page.evaluate(()=>[...document.querySelectorAll('.txt')].flatMap(e=>{const b=e.getBoundingClientRect(),r=document.createRange();r.selectNodeContents(e);const t=r.getBoundingClientRect();return t.right>b.right+2||t.bottom>b.bottom+2?[{text:e.textContent,dx:t.right-b.right,dy:t.bottom-b.bottom}]:[];}));
 await page.pdf({path:base+'.pdf',preferCSSPageSize:true,printBackground:true});await page.addStyleTag({content:'nav,#notes{display:none!important}'});
 for(let i=0;i<3;i++)await page.locator(`#slide-${i+1}`).screenshot({path:path.join(out,`slide-${lang}-${i+1}.png`)});
 validation.languages[lang]={slides:3,overflow,errors,navigation,notesVisible,speechLength:lang==='en'?notes.join(' ').split(/\s+/).length:notes.join('').length};await page.close();
}
}finally{await browser.close();}
validation.passed=Object.values(validation.languages).every(l=>!l.overflow.length&&!l.errors.length&&l.navigation&&l.notesVisible);
await fs.writeFile(path.join(out,'slide-validation.json'),JSON.stringify(validation,null,2)+'\n');console.log(JSON.stringify(validation,null,2));if(!validation.passed)process.exitCode=1;
