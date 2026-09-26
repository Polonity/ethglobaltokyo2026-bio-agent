import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { b, decks } from './content.mjs';
const deck=decks[process.argv[2]||'uniswap'];
if(!deck)throw Error('Unknown deck');
const {slides,sources}=deck;
import {makeScene} from './scene.mjs';
const require=createRequire(import.meta.url);
const PptxGenJS=require('/mnt/c/Users/hiken/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/pptxgenjs');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const out=path.join(root,'artifacts/sponsor-pitches-1min-20260926',deck.key);
await fs.mkdir(out,{recursive:true});

const C={bg:'FBF7FA',ink:'342638',muted:'716373',blue:deck.accent,teal:'067D7F',amber:'A75F14',white:'FFFFFF',line:'E2D4DF',pale:'E4F1F2',sand:'FCEDD7',dark:deck.dark};
const W=13.333333,H=7.5,tv=(v,l)=>typeof v==='object'?v[l]:v;
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const scenes={};

const scene=(s,i,lang)=>makeScene(s,i,lang,{deck,C});
const imageCache=new Map();
async function imageData(src){if(!imageCache.has(src)){const buf=await fs.readFile(src);imageCache.set(src,{data:'data:image/png;base64,'+buf.toString('base64'),w:buf.readUInt32BE(16),h:buf.readUInt32BE(20)});}return imageCache.get(src);}
function notesFor(s,lang,i){return `${i+1}. ${tv(s.title,lang).replaceAll('\n',' ')}\n\n${tv(s.notes,lang)}${s.context?'\n\n'+(lang==='ja'?'質疑用補足：':'Q&A context: ')+tv(s.context,lang):''}\n\n${lang==='ja'?'出典':'Sources'}\n`+s.refs.map(k=>`[${k}] ${sources[k].path||sources[k].url}`).join('\n');}
async function htmlElement(e){
 const base=`left:${e.x*96}px;top:${e.y*96}px;width:${e.w*96}px;height:${e.h*96}px;`;
 if(e.type==='text'){const inner=e.url?`<a href="${esc(e.url)}">${esc(e.text)}</a>`:esc(e.text);return `<div class="txt" style="${base}font-size:${e.size*96/72}px;color:#${e.color};font-weight:${e.bold?700:400};text-align:${e.align||'left'}">${inner}</div>`;}
 if(e.type==='rect')return `<div class="shape" style="${base}background:#${e.fill};${e.stroke?'border:1px solid #'+e.stroke:''}"></div>`;
 if(e.type==='line'){const x=Math.min(e.x,e.x2),y=Math.min(e.y,e.y2),w=Math.abs(e.x2-e.x),h=Math.abs(e.y2-e.y);return `<svg class="shape" style="left:${x*96}px;top:${y*96}px;width:${Math.max(w*96,2)}px;height:${Math.max(h*96,2)}px;overflow:visible"><line x1="${(e.x-x)*96}" y1="${(e.y-y)*96}" x2="${(e.x2-x)*96}" y2="${(e.y2-y)*96}" stroke="#${e.color}" stroke-width="${e.width*96/72}"/></svg>`;}
 if(e.type==='image'){const im=await imageData(e.src);if(e.crop){const q=e.crop,sx=e.w*96/q.w,sy=e.h*96/q.h;return `<div class="image" style="${base}overflow:hidden"><img alt="Recorded market acceptance GUI" src="${im.data}" style="position:absolute;max-width:none;left:${-q.x*sx}px;top:${-q.y*sy}px;width:${im.w*sx}px;height:${im.h*sy}px"></div>`;}return `<img class="image" alt="Evidence" src="${im.data}" style="${base}object-fit:contain">`;}
}
function runtimeScript(){return `const pages=[...document.querySelectorAll('.slide')];let current=0,notes=false;function move(n){current=Math.max(0,Math.min(pages.length-1,n));pages[current].scrollIntoView({behavior:'instant',block:'start'});document.querySelector('#count').textContent=(current+1)+' / '+pages.length;document.querySelector('#notes').textContent=pages[current].dataset.notes;}document.addEventListener('keydown',e=>{if(['ArrowRight','PageDown',' '].includes(e.key)){e.preventDefault();move(current+1)}if(['ArrowLeft','PageUp'].includes(e.key)){e.preventDefault();move(current-1)}if(e.key.toLowerCase()==='n'){notes=!notes;document.body.classList.toggle('show-notes',notes)}});document.querySelector('#prev').onclick=()=>move(current-1);document.querySelector('#next').onclick=()=>move(current+1);document.querySelector('#toggle').onclick=()=>{notes=!notes;document.body.classList.toggle('show-notes',notes)};function resize(){const scale=Math.min(1,(innerWidth-28)/1280);document.documentElement.style.setProperty('--scale',scale);document.documentElement.style.setProperty('--page-height',(720*scale)+'px')};addEventListener('resize',resize);resize();move(0);`;}

for(const lang of ['ja','en']){
 const pptx=new PptxGenJS();pptx.defineLayout({name:'AQUA_WIDE',width:W,height:H});pptx.layout='AQUA_WIDE';pptx.author='BioAgent project';pptx.company='BioAgent';pptx.subject='One-minute sponsor discussion pitch';pptx.title='BioAgent × '+deck.name+' / '+(lang==='ja'?'1分で伝える提案':'One-minute proposal');pptx.lang=lang==='ja'?'ja-JP':'en-US';pptx.theme={headFontFace:'Yu Gothic',bodyFontFace:'Yu Gothic',lang:pptx.lang};
 scenes[lang]=[];const pages=[];let study=`# ${pptx.title}\n\n2026-09-26 · 3 slides · About one minute · Discussion draft\n\n`;
 for(const [i,s] of slides.entries()){
  const els=scene(s,i,lang);scenes[lang].push(els);const sl=pptx.addSlide();sl.background={color:C.bg};
  for(const e of els){
   if(e.type==='text')sl.addText(e.text,{x:e.x,y:e.y,w:e.w,h:e.h,fontFace:'Yu Gothic',fontSize:e.size,color:e.color,bold:e.bold,margin:0,valign:'top',align:e.align||'left',paraSpaceAfter:0,lineSpacingMultiple:1.2,wrap:true,...(e.url?{hyperlink:{url:e.url}}:{})});
   else if(e.type==='rect')sl.addShape(pptx.ShapeType.rect,{x:e.x,y:e.y,w:e.w,h:e.h,fill:{color:e.fill},line:{color:e.stroke||e.fill,width:e.stroke?.7:0,transparency:e.stroke?0:100}});
   else if(e.type==='line')sl.addShape(pptx.ShapeType.line,{x:Math.min(e.x,e.x2),y:Math.min(e.y,e.y2),w:Math.abs(e.x2-e.x),h:Math.abs(e.y2-e.y),flipV:(e.x2-e.x)*(e.y2-e.y)<0,line:{color:e.color,width:e.width}});
   else if(e.type==='image'){const im=await imageData(e.src),q=e.crop;if(q)sl.addImage({data:im.data,x:e.x,y:e.y,w:im.w*e.w/q.w,h:im.h*e.h/q.h,sizing:{type:'crop',x:q.x*e.w/q.w,y:q.y*e.h/q.h,w:e.w,h:e.h}});else sl.addImage({data:im.data,x:e.x,y:e.y,w:e.w,h:e.h,sizing:{type:'contain',w:e.w,h:e.h}});}
  }
  const notes=notesFor(s,lang,i);sl.addNotes(notes);pages.push(`<section class="page"><article class="slide" id="slide-${i+1}" data-notes="${esc(notes)}">${(await Promise.all(els.map(htmlElement))).join('')}</article></section>`);
  study+=`## ${i+1}. ${tv(s.title,lang).replaceAll('\n',' ')}\n\n${tv(s.tag,lang)}\n\n${tv(s.notes,lang)}${s.context?'\n\n'+(lang==='ja'?'質疑用補足：':'Q&A context: ')+tv(s.context,lang):''}\n\n${lang==='ja'?'参照':'Sources'}: ${s.refs.map(k=>`[${k}] ${sources[k].path||sources[k].url}`).join(' · ')}\n\n`;
 }
 const html=`<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(pptx.title)}</title><style>*{box-sizing:border-box}body{margin:0;background:#203448;font-family:'Yu Gothic','Noto Sans CJK JP',sans-serif}.page{width:calc(1280px * var(--scale,1));height:var(--page-height,720px);margin:20px auto 38px;position:relative}.slide{width:1280px;height:720px;position:absolute;top:0;left:0;background:#${C.bg};overflow:hidden;transform:scale(var(--scale,1));transform-origin:top left}.txt,.shape,.image{position:absolute}.txt{white-space:pre-line;line-height:1.2;word-break:normal;overflow-wrap:normal}.txt a{color:inherit;text-decoration:none}nav{position:fixed;z-index:10;right:18px;bottom:16px;background:#10273e;color:white;padding:9px 14px;border-radius:8px;display:flex;align-items:center;gap:10px;font:13px sans-serif}nav a{color:#9ee1e7}button{background:#fff;border:0;padding:7px 10px;border-radius:4px;cursor:pointer}#notes{display:none;position:fixed;left:20px;right:20px;bottom:70px;max-height:230px;overflow:auto;background:#fff9eb;padding:18px;white-space:pre-wrap;font-size:15px;line-height:1.55;z-index:8}.show-notes #notes{display:block}@page{size:13.333333in 7.5in;margin:0}@media print{body{background:white}.page{width:1280px;height:720px;margin:0;break-after:page;page-break-after:always}.page:last-of-type{break-after:auto;page-break-after:auto}.slide{transform:none}nav,#notes{display:none!important}}</style></head><body>${pages.join('')}<aside id="notes"></aside><nav><a href="../index.html">JA / EN</a><button id="prev">←</button><span id="count"></span><button id="next">→</button><button id="toggle">${lang==='ja'?'発表者ノート (N)':'Notes (N)'}</button><a href="${deck.filename}-${lang}.pptx">PPTX</a><a href="${deck.filename}-${lang}.pdf">PDF</a></nav><script>${runtimeScript()}</script></body></html>`;
 await fs.writeFile(path.join(out,`${deck.filename}-${lang}.html`),html);await fs.writeFile(path.join(out,`speaker-notes-${lang}.md`),study);await pptx.writeFile({fileName:path.join(out,`${deck.filename}-${lang}.pptx`)});
}
await fs.writeFile(path.join(out,'scene-manifest.json'),JSON.stringify({slides:slides.length,languages:['ja','en'],scenes},null,2));
await fs.writeFile(path.join(out,'sources.md'),'# Sources / 根拠\n\nReviewed 2026-09-26. Proposals are not confirmed team preferences.\n\n'+Object.entries(sources).map(([k,v])=>`- [${k}] **${v.title}** — ${v.url||v.path}. ${v.kind||'Reviewed source or official requirement'}.`).join('\n')+'\n\nMaleCNS data: FlyEM / HHMI Janelia, Cambridge, MRC LMB, Google; CC-BY-4.0.\n');
console.log(JSON.stringify({out,slides:slides.length,languages:['ja','en'],speech: Object.fromEntries(['ja','en'].map(l=>[l,l==='en'?slides.map(s=>s.notes.en).join(' ').split(/\s+/).length:slides.map(s=>s.notes.ja).join('').length]))}));
