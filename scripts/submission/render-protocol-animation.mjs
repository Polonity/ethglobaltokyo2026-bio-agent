import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawn } from 'node:child_process';
const name = process.argv[2] || 'stimulus-to-action';
if (!['stimulus-to-action', 'protocol-design'].includes(name)) throw Error('Unknown animation');
const out = resolve('artifacts/protocol-animation');
await mkdir(out, {recursive:true});
const browser = await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox']});
const page = await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1});
const errors=[];page.on('pageerror',e=>errors.push(String(e)));
await page.goto(pathToFileURL(resolve(`docs/submission/presenter-kit/visuals/${name}.html`)).href+'?capture');
await page.evaluate(()=>document.fonts.ready);
const fps=15, seconds=name === 'protocol-design' ? 24 : 42;
for(const lang of ['en','ja']) {
  const encoder=spawn('ffmpeg',['-y','-v','error','-f','image2pipe','-vcodec','mjpeg','-r',String(fps),'-i','pipe:0','-an','-c:v','libx264','-preset','fast','-crf','19','-pix_fmt','yuv420p','-movflags','+faststart',`${out}/${name}-${lang}.mp4`],{stdio:['pipe','inherit','inherit']});
  const done=new Promise((res,rej)=>{encoder.on('error',rej);encoder.on('close',c=>c===0?res():rej(Error(`ffmpeg ${c}`)))});
  for(let frame=0;frame<fps*seconds;frame++) {
    await page.evaluate(({t,lang})=>window.renderAt(t,lang),{t:frame/fps,lang});
    const jpg=await page.screenshot({type:'jpeg',quality:90});
    if(!encoder.stdin.write(jpg))await new Promise(r=>encoder.stdin.once('drain',r));
    if(frame%(fps*6)===fps*3)await page.screenshot({path:`${out}/${name}-${lang}-stage-${Math.floor(frame/(fps*6))+1}.png`});
  }
  encoder.stdin.end();await done;
}
await browser.close();
if(errors.length)throw Error(errors.join('\n'));
await writeFile(`${out}/${name}-verification.json`,JSON.stringify({seconds,fps,width:1280,height:720,languages:['en','ja'],browserErrors:errors,type:'explanatory animation; illustrative values, not live evidence',audio:false},null,2));
console.log(out);
