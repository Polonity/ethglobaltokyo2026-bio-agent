import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { content, sources } from './presenter-content.mjs';

const dir = 'docs/submission/presenter-kit';
const evidence = JSON.parse(await readFile(`${dir}/capture-evidence.json`, 'utf8'));
const data = content(evidence);
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
const refs = (value) =>
  value
    .split(', ')
    .map((id) => {
      const item = sources.find((s) => s[0] === id);
      return `<a href="${esc(item[2])}">${id}</a>`;
    })
    .join(' · ');
const cards = (d, start, end) =>
  d.questions
    .slice(start, end)
    .map(
      ([q, short, detail, source], i) =>
        `<article><h3><span>${String(start + i + 1).padStart(2, '0')}</span>${esc(q)}</h3><p><strong>${esc(short)}</strong> ${esc(detail)} <small>${refs(source)}</small></p></article>`,
    )
    .join('');
const pages = Object.entries(data)
  .map(
    ([lang, d]) =>
      `<section class="sheet" data-lang="${lang}"><header><div class="eyebrow">BIOAGENT / PRESENTER KIT / ${d.label}</div><h1>${esc(d.title)}</h1><p>${esc(d.subtitle)}</p></header><div class="pitch"><h2>${d.pitchTitle}</h2><p>${esc(d.pitch)}</p></div><div class="stats">${d.stats.map(([n, s]) => `<div><b>${n}</b><span>${esc(s)}</span></div>`).join('')}</div><h2 class="section-title">${d.page1Title}</h2>${cards(d, 0, 6)}<footer>${d.label} · 1 / 2<span>ANVIL · FULL POPULATION · RESEARCH PROTOTYPE</span></footer></section><section class="sheet" data-lang="${lang}"><header><div class="eyebrow">BIOAGENT / PRESENTER KIT / ${d.label}</div><h1>${d.page2Title}</h1></header>${cards(d, 6, d.questions.length)}<div class="boundary">${esc(d.boundary)}</div><div class="sources">${sources.map(([id, name, url]) => `<a href="${esc(url)}">${id} ${esc(name)}</a>`).join(' · ')}</div><footer>${d.label} · 2 / 2<span>${esc(d.footer)}</span></footer></section>`,
  )
  .join('');
const html = `<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>BioAgent Presenter Q&A</title><style>
@page{size:A4;margin:10mm}*{box-sizing:border-box}body{margin:0;background:#e9eeec;color:#122c2b;font-family:'Noto Sans CJK JP',Arial,sans-serif;font-size:9.1pt;line-height:1.5}nav{position:sticky;top:0;z-index:2;display:flex;gap:8px;justify-content:center;padding:12px;background:#102d2c}button{border:1px solid #6a8d83;color:white;background:transparent;padding:7px 18px;cursor:pointer;border-radius:5px}button.active{background:#d4f3ab;color:#102d2c}.sheet{width:190mm;height:276mm;margin:15px auto;background:white;padding:6mm 7mm;position:relative;break-after:page}.sheet:last-child{break-after:auto}.eyebrow{font-size:8pt;letter-spacing:1.4px;color:#287160;font-weight:700}h1{font-size:20pt;line-height:1.25;margin:5px 0 7px}header>p{margin:0;color:#59716a;font-size:8.7pt}h2{font-size:10.5pt;margin:0 0 6px}.pitch{margin:14px 0;padding:12px 14px;background:#e9f3ed;border-left:3px solid #23836d}.pitch p{margin:0;font-size:9.7pt}.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:0 0 14px}.stats>div{padding:8px 10px;border:1px solid #c7dacf;border-radius:5px}.stats b{display:block;font-size:20pt;line-height:1.25}.stats span{font-size:8pt}.section-title{border-bottom:1px solid #c7dacf;padding-bottom:7px;margin-bottom:8px}article{margin:0 0 12px;break-inside:avoid}article h3{font-size:10pt;line-height:1.45;margin:0 0 4px;display:flex;gap:9px;align-items:baseline}article h3>span{font-size:8.7pt;color:#287160;min-width:17px}article p{margin:0 0 0 26px}strong{font-weight:700}small{font-size:7.3pt;white-space:nowrap}a{color:#22715f;text-decoration:none}.boundary{background:#fff4dc;border-left:3px solid #c79538;padding:8px 10px;font-size:8.2pt;margin-top:10px}.sources{margin-top:9px;font-size:7.1pt;line-height:1.6;color:#59716a}.sources a{display:inline}footer{position:absolute;left:7mm;right:7mm;bottom:4mm;border-top:1px solid #c7dacf;padding-top:6px;color:#59716a;font-size:6.7pt;display:flex;justify-content:space-between;gap:12px}footer span{text-align:right}body[data-language=ja] .sheet[data-lang=en],body[data-language=en] .sheet[data-lang=ja]{display:none}@media print{body{background:white}nav{display:none}.sheet{margin:0;padding:4mm 5mm}footer{left:5mm;right:5mm}}@media screen and (max-width:740px){.sheet{width:100%;height:auto;min-height:0;padding:20px}.stats span{font-size:7.5pt}footer{position:static;margin-top:20px}.stats b{font-size:17pt}}
</style></head><body data-language="ja"><nav><button data-select="ja" class="active">日本語</button><button data-select="en">English</button><button data-select="all">日本語 + English</button><button id="print">PDF / Print</button></nav>${pages}<script>document.querySelectorAll('[data-select]').forEach(b=>b.onclick=()=>{document.body.dataset.language=b.dataset.select;document.documentElement.lang=b.dataset.select==='en'?'en':'ja';document.querySelectorAll('[data-select]').forEach(x=>x.classList.toggle('active',x===b))});document.querySelector('#print').onclick=()=>window.print();</script></body></html>`;
await writeFile(`${dir}/qa-cheatsheet.html`, html);
for (const [lang, d] of Object.entries(data)) {
  const md = `# ${d.title}\n\n${d.subtitle}\n\n## ${d.pitchTitle}\n\n${d.pitch}\n\n${d.stats.map(([n, s]) => `- **${n}** — ${s}`).join('\n')}\n\n${d.questions
    .map(
      ([q, s, a, r], i) =>
        `## ${i + 1}. ${q}\n\n**${s}** ${a}\n\n${r
          .split(', ')
          .map((id) => {
            const x = sources.find((x) => x[0] === id);
            return `[${id}: ${x[1]}](${x[2]})`;
          })
          .join(' / ')}\n`,
    )
    .join('\n')}\n${d.boundary}\n`;
  await writeFile(`${dir}/qa-cheatsheet-${lang}.md`, md);
}
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome',
  headless: true,
  args: ['--no-sandbox'],
});
try {
  const page = await browser.newPage({ viewport: { width: 1100, height: 1250 } });
  await page.goto(pathToFileURL(resolve(`${dir}/qa-cheatsheet.html`)).href);
  await page.evaluate(() => document.fonts.ready);
  await page.emulateMedia({ media: 'print' });
  for (const lang of ['ja', 'en', 'all']) {
    await page.evaluate((l) => (document.body.dataset.language = l), lang);
    const layout = await page.locator('.sheet:visible').evaluateAll((nodes) =>
      nodes.map((el) => {
        const footer = el.querySelector('footer').getBoundingClientRect();
        const content = el.querySelector('.sources') || [...el.querySelectorAll('article')].at(-1);
        return {
          language: el.dataset.lang,
          overflow: el.scrollHeight - el.clientHeight,
          clearance: footer.top - content.getBoundingClientRect().bottom,
        };
      }),
    );
    assert(
      layout.every((x) => x.overflow < 2 && x.clearance > 8),
      JSON.stringify({ lang, layout }),
    );
    await page.pdf({
      path: `${dir}/qa-cheatsheet-${lang === 'all' ? 'ja-en' : lang}.pdf`,
      printBackground: true,
      preferCSSPageSize: true,
    });
    console.log(JSON.stringify({ lang, layout }));
  }
} finally {
  await browser.close();
}
