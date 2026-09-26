// Assemble the approved documentary script and preserved GUI recordings. Never synthesize narration.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { spawn, execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const out=resolve('artifacts/documentary'), edit=out+'/edit';
await mkdir(edit,{recursive:true});
const previous = process.argv.includes('--reuse-cuts') ? JSON.parse(await readFile(out+'/production.json','utf8')) : null;
const gui=JSON.parse(await readFile('artifacts/presenter-long/gui-evidence.json'));
const old=(await readFile('artifacts/submission-presenter-rerecord/raw-video-path.txt','utf8')).trim();
const anim=resolve('artifacts/protocol-animation');
const run=args=>new Promise((ok,no)=>{const p=spawn('ffmpeg',['-y','-v','error',...args],{stdio:'inherit'});p.on('error',no);p.on('exit',c=>c===0?ok():no(Error(`ffmpeg ${c}`)))});
const probe=f=>JSON.parse(execFileSync('ffprobe',['-v','error','-show_streams','-show_format','-of','json',f]));
const cut=(id,file,start,length,seconds=length,rate=1)=>({id,file,start,length,seconds,rate});
const common=[
 {...cut('intro-official',resolve('artifacts/documentary/sources/malecns-official-page.png'),0,20),still:true},
 cut('intro-gui',gui.clips.purpose.file,0,10),
 cut('failure-normal',old,.5,5),cut('failure-replay',old,.5,5,20,.25),
 cut('bridge',gui.clips.learning.file,1.7,19),
 cut('behavior-normal',gui.clips.behavior.file,0,13),
 cut('behavior-replay',gui.clips.behavior.file,2,5,20,.25),
 cut('behavior-pause',gui.clips.behavior.file,7,.04,7),
 cut('results',gui.clips.results.file,2,25),
 cut('market',old,145,13),cut('aqua',old,225,5.5,6),cut('uniswap',old,231.4,5.5,6)
];
const manifest={createdAt:new Date().toISOString(),audio:false,submissionReady:false,missing:'Human English narration; subtitle timing must be aligned to the recording.',scope:'Documentary review cut, preserved GUI evidence plus explanatory animation',duration:236,greetingHolds:{opening:[0,5],closing:[231,236]},sources:{},languages:{}};
const record=async f=>{if(!manifest.sources[f])manifest.sources[f]={sha256:createHash('sha256').update(await readFile(f)).digest('hex'),duration:Number.isFinite(+probe(f).format.duration)?+probe(f).format.duration:null}};
async function renderCut(s){await record(s.file);assert(s.still||s.start+s.length<=manifest.sources[s.file].duration+.1,`Source overrun ${s.id}`);s.output=`${edit}/${s.id}.mp4`;const cached=previous&&Object.values(previous.languages).flatMap(v=>v.timeline).find(v=>v.id===s.id);if(cached&&['file','start','length','seconds','rate'].every(k=>cached[k]===s[k])&&previous.sources[s.file]?.sha256===manifest.sources[s.file].sha256&&Math.abs(+probe(s.output).format.duration-s.seconds)<.1){console.log('REUSE '+s.id);return s;}await run([...(s.still?['-loop','1','-framerate','30']:['-ss',String(s.start),'-t',String(s.length)]),'-i',s.file,'-vf',`setpts=(PTS-STARTPTS)/${s.rate},fps=30,scale=1920:960:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:0:color=0x09121e,setsar=1,tpad=stop_mode=clone:stop_duration=${s.seconds}`,'-t',String(s.seconds),'-an','-c:v','libx264','-threads','4','-preset','veryfast','-crf','20','-pix_fmt','yuv420p',s.output]);console.log(s.id);return s;}
for(const s of common)await renderCut(s);
const stamp=n=>{const c=Math.round(n*100);return `${Math.floor(c/360000)}:${String(Math.floor(c/6000)%60).padStart(2,'0')}:${String(Math.floor(c/100)%60).padStart(2,'0')}.${String(c%100).padStart(2,'0')}`};
const srt=n=>new Date(Math.round(n*1000)).toISOString().slice(11,23).replace('.',',');
const wrap=(str,lang)=>{const words=lang==='ja'?[...str]:str.split(' '),lines=[''];for(const w of words){const sep=lang==='ja'?'':' ';if((lines.at(-1)+sep+w).length>(lang==='ja'?48:94))lines.push(w);else lines[lines.length-1]+=(lines.at(-1)?sep:'')+w;}assert(lines.length<=3,'Subtitle too long');return lines.join('\\N')};
const header=`[Script Info]\nScriptType: v4.00+\nPlayResX: 1920\nPlayResY: 1080\nWrapStyle: 0\n[V4+ Styles]\nFormat: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\nStyle: Caption,Noto Sans CJK JP,32,&H00FFFFFF,&H00FFFFFF,&H001E1209,&H001E1209,0,0,0,0,100,100,0,0,1,1,0,2,50,50,15,1\nStyle: Note,Noto Sans CJK JP,24,&H00B6EBD7,&H00FFFFFF,&H001E1209,&H001E1209,0,0,0,0,100,100,0,0,3,8,0,9,25,25,60,1\n[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n`;
const paragraphTimes=[ [0,9,15,20,25], [25,31,38,41,50], [50,56,62,68,80,86,92,111], [111,117,121,129,137,144,151], [151,160,170,176], [176,182,201], [201,207,213,219,226] ];
for(const lang of ['en','ja']){
 const pipeline=await renderCut(cut(`pipeline-${lang}`,`${anim}/stimulus-to-action-${lang}.mp4`,0,42));
 const design=await renderCut(cut(`design-${lang}`,`${anim}/protocol-design-${lang}.mp4`,0,24,30));
 const byId=Object.fromEntries(common.map(s=>[s.id,s]));
 const sequence=['intro-official','intro-gui','failure-normal','failure-replay',pipeline,'bridge','behavior-normal','behavior-replay','behavior-pause','results','market','aqua','uniswap',design].map(s=>typeof s==='string'?byId[s]:s);
 let offset=0;const timeline=sequence.map(s=>{const row={...s,startOnTimeline:offset,endOnTimeline:offset+s.seconds};offset+=s.seconds;return row});assert(offset===236);
 const md=await readFile(`docs/submission/presenter-kit/documentary-script-${lang}.md`,'utf8');
 const sections=md.split(/^## /m).slice(1,8).map(sec=>sec.split('\n').slice(1).filter(l=>!l.startsWith('[')).join('\n').split(/\n\s*\n/).map(p=>p.replace(/\s+/g,' ').trim()).filter(Boolean));
 let ass=header;const cues=[];
 const add=(start,end,text,style='Caption')=>{start+=5;end+=5;assert(end>start);ass+=`Dialogue: 0,${stamp(start)},${stamp(end)},${style},,0,0,0,,${wrap(text,lang)}\n`;if(style==='Caption')cues.push({start,end,text});};
 sections.forEach((ps,k)=>{assert(ps.length===paragraphTimes[k].length-1,`Script paragraph mismatch ${lang} ${k}`);ps.forEach((p,j)=>{
  if(k===3&&(j===3||j===4))return;
  const start=paragraphTimes[k][j],end=paragraphTimes[k][j+1];
  // Keep adoption rationale and the mechanics as separate subtitle cues.
  if(k===2&&j===3){const parts=lang==='en'?p.split(/(?<=regression\.) /):p.split(/(?<=選びました。) /);assert(parts.length===2);add(start,start+7,parts[0]);add(start+7,end,parts[1]);}
  else if(k===2&&j===6){const parts=lang==='en'?p.split(/(?<=[.!]) /):p.split(/(?<=。) /);assert(parts.length===3);add(start+.1,start+7,parts[0]);add(start+7,start+14,parts[1]);add(start+14,end-.12,parts[2]);}
  else add(start+.1,end-.12,p);
 });});
 // Collection captions aligned to the visible counter changes in the 0.25x replay.
 if(lang==='en'){add(129,135,'Almost there…');add(135,137,'MOMO got it!');add(137,139,'Now, SORA…');add(139,144,'Got it!');}
 else {add(129,135,'あと少し……。');add(135,137,'MOMO、取りました！');add(137,139,'さあ、SORA……。');add(139,144,'取りました！');}
 add(0,14,'Connectome data: MaleCNS v1.0 · male-cns.janelia.org','Note');
 add(25,30,lang==='ja'?'以前の実装 · 通常速度':'Earlier implementation · normal speed','Note');
 add(30,50,lang==='ja'?'以前の実装 · 同じ動作の0.25倍速リプレイ':'Earlier implementation · same actions, 0.25x replay','Note');
 add(92,111,'AMD Ryzen 9 9950X · CPU · NumPy / SciPy','Note');
 add(111,124,lang==='ja'?'修正・学習後の実行 · 通常速度':'Revised implementation · trained readout · normal speed','Note');
 add(124,144,lang==='ja'?'同じ動作の0.25倍速リプレイ':'Same actions · 0.25x replay','Note');
 add(144,151,lang==='ja'?'回収後の記録画面を停止':'Recorded frame paused after collection','Note');
 add(176,201,lang==='ja'?'検証済みの別収録 · Test assets · Ethereum fork':'Separate verified recording · Test assets · Ethereum fork','Note');
 const list=`${edit}/${lang}-concat.txt`,assPath=`${edit}/${lang}.ass`;
 await writeFile(list,sequence.map(s=>`file '${s.output}'`).join('\n'));await writeFile(assPath,ass);
 const file=`${out}/bioagent-documentary-review-${lang}.mp4`;
 await run(['-f','concat','-safe','0','-i',list,'-vf',`ass=${assPath}`,'-an','-c:v','libx264','-threads','4','-preset','fast','-crf','20','-pix_fmt','yuv420p','-movflags','+faststart',file]);
 cues.sort((a,b)=>a.start-b.start);await writeFile(`${out}/bioagent-documentary-${lang}.srt`,cues.map((c,i)=>`${i+1}\n${srt(c.start)} --> ${srt(c.end)}\n${c.text}\n`).join('\n'));
 await run(['-i',file,'-f','null','-']);
 const result=probe(file);assert(Math.abs(+result.format.duration-236)<.1);assert(!result.streams.some(s=>s.codec_type==='audio'));
 manifest.languages[lang]={file,duration:+result.format.duration,subtitleCues:cues.length,decoded:true,timeline};
 await writeFile(`${out}/production.json`,JSON.stringify(manifest,null,2));console.log(`COMPLETE ${lang} ${file}`);
}
