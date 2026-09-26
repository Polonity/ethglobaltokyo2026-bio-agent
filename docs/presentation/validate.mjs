import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const out=path.join(root,'artifacts/explanation-slides-20260926');
await fs.mkdir(path.join(out,'previews'),{recursive:true});
const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--allow-file-access-from-files']});
const report={createdAt:new Date().toISOString(),method:'Chrome rendering and PDF export of the common scene model; PPTX package checks recorded separately',languages:{}};
try{
 for(const lang of ['ja','en']){
  const page=await browser.newPage({viewport:{width:1320,height:800},deviceScaleFactor:1,locale:lang==='ja'?'ja-JP':'en-US'}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(path.join(out,`BioAgent-${lang}.html`)).href);
  await page.evaluate(()=>document.fonts.ready);
  await page.locator('#next').click();
  const navigation=await page.locator('#count').innerText();
  await page.keyboard.press('n');
  const notesVisible=await page.locator('#notes').isVisible();
  await page.keyboard.press('n');
  await page.addStyleTag({content:'nav,#notes{display:none!important}'});
  const overflow=await page.evaluate(()=>[...document.querySelectorAll('.slide')].flatMap((slide,i)=>[...slide.querySelectorAll('.txt')].flatMap(el=>{
   const box=el.getBoundingClientRect(),range=document.createRange();range.selectNodeContents(el);const text=range.getBoundingClientRect();
   const bad=text.right>box.right+2||text.bottom>box.bottom+2||text.left<box.left-2;
   return bad?[{slide:i+1,text:el.textContent,box:{w:box.width,h:box.height},rendered:{w:text.width,h:text.height},overflowX:text.right-box.right,overflowY:text.bottom-box.bottom}]:[];
  })));
  const imageCount=await page.locator('.slide img').count();
  const brokenImages=await page.evaluate(()=>[...document.images].filter(x=>!x.complete||!x.naturalWidth).length);
  const count=await page.locator('.slide').count();
  for(let i=1;i<=count;i++)await page.locator(`#slide-${i}`).screenshot({path:path.join(out,'previews',`${lang}-${String(i).padStart(2,'0')}.png`),animations:'disabled'});
  await page.pdf({path:path.join(out,`BioAgent-${lang}.pdf`),printBackground:true,preferCSSPageSize:true,displayHeaderFooter:false});
  report.languages[lang]={slides:count,imageCount,brokenImages,browserErrors:errors,navigationWorks:navigation==='2 / 28',notesVisible,overflow};
  await page.close();
 }
 await fs.writeFile(path.join(out,'validation.json'),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify(report,null,2));
}finally{await browser.close();}
