import { chromium } from '@playwright/test';
import { writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
const out=resolve('artifacts/documentary');await mkdir(out+'/checks',{recursive:true});
const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});
const results=[];
for(const lang of ['en','ja']){
 const html=`<!doctype html><style>body{margin:0;background:#09121e}video{width:100vw;height:100vh;object-fit:contain}</style><video muted playsinline preload="auto" src="bioagent-documentary-review-${lang}.mp4"></video>`;
 await writeFile(`${out}/review-${lang}.html`,html);
 const page=await browser.newPage({viewport:{width:1280,height:720}});const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(pathToFileURL(`${out}/review-${lang}.html`).href);await page.waitForFunction(()=>document.querySelector('video').readyState>=2);
 const meta=await page.evaluate(()=>{const v=document.querySelector('video');return {duration:v.duration,width:v.videoWidth,height:v.videoHeight}});assert(Math.abs(meta.duration-226)<.1);assert(meta.width===1920&&meta.height===1080);
 await page.evaluate(()=>document.querySelector('video').play());await page.waitForTimeout(1500);const played=await page.evaluate(()=>document.querySelector('video').currentTime);assert(played>1);
 for(const t of [5,35,70,100,135.5,139.5,164,191,221]){
  await page.evaluate(async t=>{const v=document.querySelector('video');v.pause();await new Promise(r=>{v.addEventListener('seeked',r,{once:true});v.currentTime=t})},t);
  await page.screenshot({path:`${out}/checks/${lang}-${t}.jpg`,type:'jpeg',quality:90});
 }
 await page.evaluate(async()=>{const v=document.querySelector('video');await new Promise(r=>{v.addEventListener('seeked',r,{once:true});v.currentTime=225.5});await v.play()});
 await page.waitForFunction(()=>document.querySelector('video').ended);
 assert(errors.length===0);results.push({lang,...meta,playbackAdvanced:played,ended:true,errors,samples:[5,35,70,100,135.5,139.5,164,191,221]});await page.close();
}
await browser.close();await writeFile(`${out}/browser-check.json`,JSON.stringify(results,null,2));console.log(JSON.stringify(results));
