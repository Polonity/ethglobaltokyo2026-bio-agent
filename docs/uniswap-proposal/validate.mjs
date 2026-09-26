import {chromium} from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const out=path.join(root,'artifacts/uniswap-proposal-20260926');
await fs.mkdir(path.join(out,'previews'),{recursive:true});
const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--allow-file-access-from-files']});
const report={createdAt:new Date().toISOString(),method:'Chrome common-scene rendering; PDFium and PPTX package checks recorded separately',languages:{},handouts:{}};
try{
 for(const lang of ['ja','en']){
  const page=await browser.newPage({viewport:{width:1320,height:800},deviceScaleFactor:1,locale:lang==='ja'?'ja-JP':'en-US'}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(path.join(out,`Uniswap-proposal-${lang}.html`)).href);await page.evaluate(()=>document.fonts.ready);
  await page.locator('#next').click();const navigation=await page.locator('#count').innerText();await page.keyboard.press('n');const notesVisible=await page.locator('#notes').isVisible();await page.keyboard.press('n');
  await page.addStyleTag({content:'nav,#notes{display:none!important}'});
  const overflow=await page.evaluate(()=>[...document.querySelectorAll('.slide')].flatMap((slide,i)=>[...slide.querySelectorAll('.txt')].flatMap(el=>{const box=el.getBoundingClientRect(),range=document.createRange();range.selectNodeContents(el);const text=range.getBoundingClientRect();return text.right>box.right+2||text.bottom>box.bottom+2||text.left<box.left-2?[{slide:i+1,text:el.textContent,overflowX:text.right-box.right,overflowY:text.bottom-box.bottom}]:[];})));
  const count=await page.locator('.slide').count();const brokenImages=await page.evaluate(()=>[...document.images].filter(x=>!x.complete||!x.naturalWidth).length);
  for(let i=1;i<=count;i++)await page.locator(`#slide-${i}`).screenshot({path:path.join(out,'previews',`${lang}-${String(i).padStart(2,'0')}.png`),animations:'disabled'});
  await page.pdf({path:path.join(out,`Uniswap-proposal-${lang}.pdf`),printBackground:true,preferCSSPageSize:true,displayHeaderFooter:false});
  report.languages[lang]={slides:count,brokenImages,browserErrors:errors,navigationWorks:navigation==='2 / 14',notesVisible,overflow};await page.close();
  for(const prefix of ['Meeting-brief','Decision-sheet']){
   const p=await browser.newPage({viewport:{width:850,height:1150}});await p.goto(pathToFileURL(path.join(out,`${prefix}-${lang}.html`)).href);await p.evaluate(()=>document.fonts.ready);
   const overflow=await p.evaluate(()=>{const paper=document.querySelector('.paper'),footer=document.querySelector('.footer'),children=[...paper.children].filter(x=>x!==footer);return {beyondFooter:children.filter(x=>x.getBoundingClientRect().bottom>footer.getBoundingClientRect().top-3).map(x=>x.textContent),horizontal:paper.scrollWidth>paper.clientWidth};});
   await p.pdf({path:path.join(out,`${prefix}-${lang}.pdf`),printBackground:true,preferCSSPageSize:true});await p.locator('.paper').screenshot({path:path.join(out,'previews',`${prefix}-${lang}.png`)});report.handouts[`${prefix}-${lang}`]=overflow;await p.close();
  }
 }
 const page=await browser.newPage();await page.goto(pathToFileURL(path.join(out,'index.html')).href);const hrefs=await page.locator('a').evaluateAll(as=>as.map(a=>a.getAttribute('href')));const missing=[];for(const href of hrefs){if(!href.startsWith('http')&&href!=='validation.json')try{await fs.access(path.join(out,href));}catch{missing.push(href);}}
 await page.locator('summary').click();await page.locator('video').evaluate(v=>{v.muted=true;return v.play()});await page.waitForFunction(()=>document.querySelector('video').currentTime>.5,{},{timeout:15000});report.index={missingLinks:missing,videoPlayback:await page.locator('video').evaluate(v=>({currentTime:v.currentTime,duration:v.duration,readyState:v.readyState,error:v.error?.message||null}))};await page.close();
 await fs.writeFile(path.join(out,'validation.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
}finally{await browser.close();}
