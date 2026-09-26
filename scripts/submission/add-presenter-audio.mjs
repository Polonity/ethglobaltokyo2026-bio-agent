// Attach the presenter's recording, made while watching the review cut, without retiming speech.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { execFileSync, spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const audio=process.argv[2];if(!audio)throw Error('Pass the presenter audio file path');
const out=resolve('artifacts/documentary');await mkdir(out,{recursive:true});
const probe=f=>JSON.parse(execFileSync('ffprobe',['-v','error','-show_streams','-show_format','-of','json',f]));
const run=args=>new Promise((ok,no)=>{const p=spawn('ffmpeg',['-y','-v','error',...args],{stdio:'inherit'});p.on('error',no);p.on('exit',c=>c===0?ok():no(Error(`ffmpeg ${c}`)))});
const a=probe(audio);assert(a.streams.some(s=>s.codec_type==='audio'&&s.codec_name==='aac'));
const duration=+a.format.duration;assert(duration<=240,'Narration exceeds four-minute limit');
const manifest={createdAt:new Date().toISOString(),audioSource:resolve(audio),audioSha256:createHash('sha256').update(await readFile(audio)).digest('hex'),alignment:'Zero offset: presenter recorded while watching the review video.',speechProcessing:'Original AAC stream copied; no speed, volume, or pause changes.',subtitleTiming:'Existing video timing retained at presenter instruction; not word-level forced alignment.',files:{}};
for(const lang of ['en','ja']){
 const video=`${out}/bioagent-documentary-review-${lang}.mp4`,file=`${out}/bioagent-documentary-narrated-${lang}.mp4`;
 const vd=+probe(video).format.duration, seconds=Math.max(vd,duration);assert(seconds<=240);
 await run(['-i',video,'-i',audio,'-map','0:v:0','-map','1:a:0','-vf',`tpad=stop_mode=clone:stop_duration=${Math.max(0,seconds-vd)+.05}`,'-t',String(seconds),'-c:v','libx264','-threads','4','-preset','fast','-crf','19','-pix_fmt','yuv420p','-c:a','copy','-map_metadata','-1','-movflags','+faststart',file]);
 await run(['-i',file,'-map','0:v:0','-map','0:a:0','-f','null','-']);
 const p=probe(file);assert(p.streams.some(s=>s.codec_type==='video')&&p.streams.some(s=>s.codec_type==='audio'));
 assert(Math.abs(+p.format.duration-seconds)<.1);
 // Compare encoded AAC payload hashes; verifies the full narration survived muxing unchanged.
 const packetHashes=f=>execFileSync('ffprobe',['-v','error','-select_streams','a:0','-show_packets','-show_data_hash','sha256','-show_entries','packet=data_hash','-of','csv=p=0',f],{maxBuffer:4e6}).toString().trim();
 assert(packetHashes(audio)===packetHashes(file),'Audio payload changed or was truncated');
 manifest.files[lang]={file,duration:+p.format.duration,sourceVideo:video,heldLastFrameSeconds:seconds-vd,audioPacketsIdentical:true,decoded:true};
 await writeFile(`${out}/narration-production.json`,JSON.stringify(manifest,null,2));console.log(`COMPLETE ${lang} ${file}`);
}
