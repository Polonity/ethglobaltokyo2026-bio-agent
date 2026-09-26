import {chromium} from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {decks} from './content.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const out=path.join(root,'artifacts/sponsor-pitches-1min-20260926');
await fs.mkdir(path.join(out,'previews'),{recursive:true});
const previous=process.argv[2]?JSON.parse(await fs.readFile(path.join(out,'validation.json'),'utf8')):{};
const report={...previous,createdAt:new Date().toISOString(),scope:'Three slides per sponsor and language, approximately one minute. Isolated CPU timing only; no learning, trading, deployment or external submission.',decks:{...(previous.decks||{})}};
const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--allow-file-access-from-files']});
try{
 for(const d of Object.values(decks).filter(d=>!process.argv[2]||d.key===process.argv[2]))for(const lang of ['ja','en']){
  const base=path.join(out,d.key,`${d.filename}-${lang}`),p=await browser.newPage({viewport:{width:1320,height:800}}),errors=[];
  p.on('pageerror',e=>errors.push(e.message));await p.goto(pathToFileURL(base+'.html').href);await p.evaluate(()=>document.fonts.ready);
  await p.locator('#next').click();const nav=await p.locator('#count').innerText();await p.keyboard.press('n');const notes=await p.locator('#notes').isVisible();await p.keyboard.press('n');await p.addStyleTag({content:'nav,#notes{display:none!important}'});
  const overflow=await p.evaluate(()=>[...document.querySelectorAll('.slide')].flatMap((s,i)=>[...s.querySelectorAll('.txt')].flatMap(e=>{const b=e.getBoundingClientRect(),r=document.createRange();r.selectNodeContents(e);const t=r.getBoundingClientRect();return t.right>b.right+2||t.bottom>b.bottom+2||t.left<b.left-2?[{slide:i+1,text:e.textContent,x:t.right-b.right,y:t.bottom-b.bottom}]:[];})));
  const count=await p.locator('.slide').count();await p.pdf({path:base+'.pdf',preferCSSPageSize:true,printBackground:true});
  for(let i=1;i<=count;i++)await p.locator(`#slide-${i}`).screenshot({path:path.join(out,'previews',`${d.key}-${lang}-${i}.png`)});
  report.decks[`${d.key}-${lang}`]={slides:count,navigationWorks:nav==='2 / 3',notesVisible:notes,browserErrors:errors,overflow};await p.close();
 }
 report.passed=Object.values(report.decks).every(d=>d.slides===3&&d.navigationWorks&&d.notesVisible&&!d.overflow.length&&!d.browserErrors.length);
 delete report.visualReview;
 await fs.writeFile(path.join(out,'validation.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
}finally{await browser.close();}
