import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
import {chromium} from '@playwright/test';
const require=createRequire(import.meta.url);
const PptxGenJS=require('/mnt/c/Users/hiken/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/pptxgenjs');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const out=path.join(root,'artifacts/bioagent-benefits-20260926');
const evidence=JSON.parse(await fs.readFile(path.join(out,'measurement.json'),'utf8'));
const brief=await fs.readFile(path.join(root,'docs/sponsor-pitch/bioagent-benefits-ja-en.md'),'utf8');
const f=evidence.summary.food,c=evidence.summary.collisions;
const foodPct=Math.round((f.learned/f.before-1)*100),contactPct=Math.round((c.learned/c.before-1)*100);
const matched=evidence.reuse.matchedTicks.toLocaleString('en-US');
const content={
 ja:{
  title:'BioAgent：効果を測り、学習成果を再利用する',
  lead:'仕様の狙い：改善した内容を共有し、学習成果の取り違えと再実装の負担を減らす。',
  tag:'1分で伝える：実測と、次の合格条件',
  cards:[
   {label:'01  行動への効果',status:'新規実測 / 軽量採餌モデル',big:`採餌 +${foodPct}%\n接触 +${contactPct}%`,body:'新しい30条件で学習前後を比較。\n総合報酬は悪化。\n全体としての改善は未達。',foot:'7神経版・学習1回・各300行動。\n通常AIとの比較は未実施。',color:'A75F14'},
   {label:'02  仕様が目指す再利用の効果',status:'限定実装で確認',big:`${matched}ステップ\n復元後も一致`,body:'行動・報酬が再学習なしで一致。\n別モデル・別用途への\n読出しの誤適用を拒否。',foot:'同一ランタイム内で確認。\n全仕様の相互運用は未検証。',color:'087E74'},
   {label:'03  次の合格条件',status:'これから検証',big:'採餌が増え、\n接触が増えない',body:'未使用条件で性能を確かめる。\n独立した利用側でも、\n保存した成果を再現する。',foot:'小型AI・組替え回路との比較で、\n生物由来の構造の寄与を分ける。',color:'315B9E'}
  ],
  bottom:'Bio固有の記述：回路の出自 ＋ 身体・入力変換 ＋ 学習範囲 ＋ 評価条件',
  notes:brief.split('## 日本語：1分の説明\n\n')[1].split('\n\n##')[0],
  noteLabel:'説明・質疑のメモ',
 },
 en:{
  title:'BioAgent: measure value, reuse learned results',
  lead:'Specification goal: share what improved, avoid incompatible reuse, and reduce reimplementation.',
  tag:'ONE MINUTE: MEASURED EFFECTS AND NEXT ACCEPTANCE CRITERIA',
  cards:[
   {label:'01  Behavioral effect',status:'NEW MEASUREMENT / SMALL MODEL',big:`Food +${foodPct}%\nContacts +${contactPct}%`,body:'Compared on 30 new scenarios.\nTotal reward got worse.\nNo overall improvement yet.',foot:'7-neuron model; one training run;\n300 actions per scenario. No AI baseline.',color:'A75F14'},
   {label:'02  Reuse the spec aims to enable',status:'VERIFIED IN A LIMITED IMPLEMENTATION',big:`${matched} steps\nmatch after restore`,body:'Same actions and rewards; no retraining.\nWrong-model and wrong-task\nreadout imports rejected.',foot:'Within one runtime. Full-profile\ninteroperability is not yet verified.',color:'087E74'},
   {label:'03  Next acceptance criteria',status:'TO BE TESTED',big:'More food;\nno more contacts',body:'Measure on untouched scenarios.\nAn independent consumer\nshould reproduce the saved result.',foot:'Compare small AI and rewired circuits\nto isolate the biological contribution.',color:'315B9E'}
  ],
  bottom:'Bio-specific semantics: circuit provenance + body / input mappings + learning scope + evaluation conditions',
  notes:brief.split('## English: one-minute explanation\n\n')[1].split('\n\n##')[0],
  noteLabel:'Speaking notes and Q&A',
 }
};
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const validation={createdAt:new Date().toISOString(),scope:'One-page JA/EN benefit evidence brief; new offline experiment, no transactions',languages:{}};
const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--allow-file-access-from-files']});
try{
 for(const [lang,d] of Object.entries(content)){
  const elems=[];
  const rect=(x,y,w,h,color)=>elems.push({type:'rect',x,y,w,h,color});
  const text=(value,x,y,w,h,size=20,color='25323D',bold=false)=>elems.push({type:'text',value,x,y,w,h,size,color,bold});
  rect(0,0,13.333333,7.5,'F5F7F8');rect(.5,.38,.45,.05,'087E74');
  text(d.tag,1.12,.28,11.7,.36,11,'087E74',true);
  text(d.title,.55,.94,12.25,.67,lang==='ja'?29:30,'25323D',true);
  text(d.lead,.57,1.81,12.2,.63,16,'576671');
  for(const [i,card] of d.cards.entries()){
   const x=.55+i*4.16;
   rect(x,2.75,3.9,3.85,'FFFFFF');rect(x,2.75,3.9,.045,card.color);
   text(card.label,x+.2,2.98,3.5,.35,lang==='ja'?15:14,card.color,true);
   text(card.status,x+.2,3.44,3.5,.3,lang==='ja'?11:9,'576671');
   text(card.big,x+.2,3.96,3.5,.91,lang==='ja'?26:24,card.color,true);
   text(card.body,x+.2,5.07,3.5,.8,lang==='ja'?14:12.7,'25323D');
   text(card.foot,x+.2,6.01,3.5,.55,lang==='ja'?10.5:10,'576671');
  }
  rect(.55,6.72,12.22,.4,'E0EEEB');text(d.bottom,.73,6.80,11.86,.28,lang==='ja'?12:11,'204A45',true);
  text('BIOAGENT  /  2026.09.26',.56,7.28,3,.18,8,'576671',true);
  text('SOURCES: protocol.json · measurement.json · notes-ja-en.md',4.5,7.28,8.2,.18,8,'576671');
  const pptx=new PptxGenJS();pptx.defineLayout({name:'WIDE',width:13.333333,height:7.5});pptx.layout='WIDE';
  pptx.author='BioAgent project';pptx.title=d.title;pptx.lang=lang==='ja'?'ja-JP':'en-US';pptx.theme={headFontFace:'Yu Gothic',bodyFontFace:'Yu Gothic',lang:pptx.lang};
  const sl=pptx.addSlide();sl.background={color:'F5F7F8'};
  for(const e of elems){
   if(e.type==='rect')sl.addShape(pptx.ShapeType.rect,{x:e.x,y:e.y,w:e.w,h:e.h,fill:{color:e.color},line:{transparency:100}});
   else sl.addText(e.value,{x:e.x,y:e.y,w:e.w,h:e.h,fontFace:'Yu Gothic',fontSize:e.size,color:e.color,bold:e.bold,margin:0,valign:'top',lineSpacingMultiple:1.15,breakLine:false});
  }
  sl.addNotes(d.notes+'\n\n'+brief);
  const base=path.join(out,`BioAgent-benefits-${lang}`);
  await pptx.writeFile({fileName:base+'.pptx'});
  const elements=elems.map(e=>e.type==='rect'?`<div class="shape" style="left:${e.x*96}px;top:${e.y*96}px;width:${e.w*96}px;height:${e.h*96}px;background:#${e.color}"></div>`:`<div class="txt" style="left:${e.x*96}px;top:${e.y*96}px;width:${e.w*96}px;height:${e.h*96}px;font-size:${e.size*96/72}px;color:#${e.color};font-weight:${e.bold?700:400}">${esc(e.value)}</div>`).join('');
  await fs.writeFile(base+'.html',`<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(d.title)}</title><style>*{box-sizing:border-box}body{margin:0;background:#273943;font-family:'Yu Gothic','Noto Sans CJK JP',sans-serif}.slide{width:1280px;height:720px;position:relative;background:#F5F7F8;margin:20px auto}.txt,.shape{position:absolute}.txt{line-height:1.15;white-space:pre-line}nav{max-width:1250px;margin:15px auto;color:white;font:15px sans-serif}nav a{color:#B3EBDF;margin-right:20px}details{max-width:1250px;background:white;margin:20px auto;padding:20px;font-size:16px;line-height:1.7}pre{white-space:pre-wrap}summary{cursor:pointer}@page{size:13.333333in 7.5in;margin:0}@media print{body{background:white}.slide{margin:0}nav,details{display:none}}</style></head><body><nav><a href="BioAgent-benefits-ja.html">日本語</a><a href="BioAgent-benefits-en.html">English</a><a href="BioAgent-benefits-${lang}.pdf">PDF</a><a href="BioAgent-benefits-${lang}.pptx">PowerPoint</a><a href="notes-ja-en.md">Q&A / Evidence</a></nav><article class="slide">${elements}</article><details><summary>${d.noteLabel}</summary><p>${esc(d.notes)}</p><pre>${esc(brief)}</pre></details></body></html>`);
  const page=await browser.newPage({viewport:{width:1340,height:850}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await page.goto(pathToFileURL(base+'.html').href);await page.evaluate(()=>document.fonts.ready);
  const overflow=await page.evaluate(()=>[...document.querySelectorAll('.txt')].flatMap(e=>{const box=e.getBoundingClientRect(),range=document.createRange();range.selectNodeContents(e);const t=range.getBoundingClientRect();return t.right>box.right+2||t.bottom>box.bottom+2?[{text:e.textContent,dx:t.right-box.right,dy:t.bottom-box.bottom}]:[];}));
  await page.locator('summary').click();const notesOpen=await page.locator('details').getAttribute('open')!==null;
  await page.pdf({path:base+'.pdf',preferCSSPageSize:true,printBackground:true});
  await page.locator('.slide').screenshot({path:base+'.png'});
  validation.languages[lang]={slides:1,overflow,errors,notesOpen,pptxNativeOfficeRendered:false};
  await page.close();
 }
}finally{await browser.close();}
validation.passed=Object.values(validation.languages).every(v=>!v.overflow.length&&!v.errors.length&&v.notesOpen);
await fs.writeFile(path.join(out,'notes-ja-en.md'),brief);
await fs.writeFile(path.join(out,'validation.json'),JSON.stringify(validation,null,2)+'\n');
console.log(JSON.stringify(validation,null,2));
if(!validation.passed)process.exitCode=1;
