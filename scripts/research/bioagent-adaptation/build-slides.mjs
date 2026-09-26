import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { chromium } from '@playwright/test';
const require = createRequire(import.meta.url);
const PptxGenJS = require('/mnt/c/Users/hiken/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/pptxgenjs');
const out = path.resolve('artifacts/bioagent-adaptation-20260926');
const report = await fs.readFile(path.join(out, 'findings-ja-en.md'), 'utf8');
const b = (ja, en) => ({ ja, en }),
  langValue = (v, l) => (typeof v === 'object' ? v[l] : v);
const slides = JSON.parse(await fs.readFile('docs/research/bioagent-adaptation/slides.json', 'utf8'));
const esc = (s) =>
  String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
const validation = { createdAt: new Date().toISOString(), languages: {} };
const browser = await chromium.launch({
  executablePath: '/usr/bin/google-chrome',
  headless: true,
  args: ['--no-sandbox', '--allow-file-access-from-files'],
});
try {
  for (const lang of ['ja', 'en']) {
    const pptx = new PptxGenJS();
    pptx.defineLayout({ name: 'WIDE', width: 13.333333, height: 7.5 });
    pptx.layout = 'WIDE';
    pptx.title = 'BioAgent Framework: effects and shared interfaces';
    pptx.author = 'BioAgent project';
    pptx.lang = lang === 'ja' ? 'ja-JP' : 'en-US';
    pptx.theme = { headFontFace: 'Yu Gothic', bodyFontFace: 'Yu Gothic', lang: pptx.lang };
    const htmlSlides = [],
      notes = [];
    for (const [i, s] of slides.entries()) {
      const t = (v) => langValue(v, lang),
        els = [];
      const rect = (x, y, w, h, color) => els.push({ type: 'rect', x, y, w, h, color });
      const text = (value, x, y, w, h, size, color = '25323D', bold = false) =>
        els.push({ type: 'text', text: t(value), x, y, w, h, size, color, bold });
      rect(0, 0, 13.333333, 7.5, 'F5F7F8');
      rect(0.52, 0.4, 0.43, 0.05, '087E74');
      text(s.tag, 1.13, 0.29, 11.8, 0.35, 12, '087E74', true);
      text(s.title, 0.55, 1.0, 12.25, 1.05, lang === 'ja' ? 31 : 30, '25323D', true);
      text(s.lead, 0.58, 2.04, 12.1, 0.52, 17, '576671');
      s.cards.forEach((card, j) => {
        const x = 0.55 + j * 4.16;
        rect(x, 2.95, 3.9, 3.28, 'FFFFFF');
        rect(x, 2.95, 3.9, 0.045, card.color);
        text(card.label, x + 0.2, 3.2, 3.5, 0.56, lang === 'ja' ? 13 : 10.8, card.color, true);
        text(card.big, x + 0.2, 4.02, 3.5, 1.02, lang === 'ja' ? 22 : 19.5, card.color, true);
        text(card.body, x + 0.2, 5.36, 3.5, 0.65, lang === 'ja' ? 13.3 : 11.6);
      });
      rect(0.55, 6.52, 12.23, 0.55, 'E0EEEB');
      text(s.foot, 0.75, 6.66, 11.82, 0.35, lang === 'ja' ? 11.5 : 10.3, '204A45');
      text('BIOAGENT / RESEARCH / 2026.09.26', 0.55, 7.28, 3.7, 0.18, 8, '576671', true);
      text(s.refs, 4.35, 7.28, 7.8, 0.18, 7.5, '576671');
      text(`${i + 1} / 3`, 12.3, 7.26, 0.6, 0.2, 9, '087E74', true);
      const slide = pptx.addSlide();
      slide.background = { color: 'F5F7F8' };
      for (const e of els) {
        if (e.type === 'rect')
          slide.addShape(pptx.ShapeType.rect, {
            x: e.x,
            y: e.y,
            w: e.w,
            h: e.h,
            fill: { color: e.color },
            line: { transparency: 100 },
          });
        else
          slide.addText(e.text, {
            x: e.x,
            y: e.y,
            w: e.w,
            h: e.h,
            fontFace: 'Yu Gothic',
            fontSize: e.size,
            color: e.color,
            bold: e.bold,
            margin: 0,
            valign: 'top',
            lineSpacingMultiple: 1.17,
          });
      }
      const note = t(s.notes) + '\n\nSources: ' + s.refs + '\n\n' + report;
      slide.addNotes(note);
      notes.push(t(s.notes));
      const html = els
        .map((e) =>
          e.type === 'rect'
            ? `<div class="shape" style="left:${e.x * 96}px;top:${e.y * 96}px;width:${e.w * 96}px;height:${e.h * 96}px;background:#${e.color}"></div>`
            : `<div class="txt" style="left:${e.x * 96}px;top:${e.y * 96}px;width:${e.w * 96}px;height:${e.h * 96}px;font-size:${(e.size * 96) / 72}px;color:#${e.color};font-weight:${e.bold ? 700 : 400}">${esc(e.text)}</div>`,
        )
        .join('');
      htmlSlides.push(
        `<section class="page"><article class="slide" id="slide-${i + 1}" data-notes="${esc(t(s.notes))}">${html}</article></section>`,
      );
    }
    const base = path.join(out, `BioAgent-framework-${lang}`);
    await pptx.writeFile({ fileName: base + '.pptx' });
    await fs.writeFile(path.join(out, `speaker-script-${lang}.md`), notes.join('\n\n') + '\n');
    const html = `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>BioAgent research / ${lang}</title><style>*{box-sizing:border-box}body{margin:0;background:#273943;font-family:'Yu Gothic','Noto Sans CJK JP',sans-serif}.page{width:calc(1280px * var(--scale,1));height:calc(720px * var(--scale,1));position:relative;margin:20px auto 40px}.slide{width:1280px;height:720px;position:absolute;background:#F5F7F8;transform:scale(var(--scale,1));transform-origin:top left}.txt,.shape{position:absolute}.txt{line-height:1.17;white-space:pre-line}nav{position:fixed;right:16px;bottom:16px;padding:12px;background:#122935;color:white;z-index:3;font:14px sans-serif}nav a{color:#B3EBDF;margin:0 10px}button{padding:7px;margin:0 7px;cursor:pointer}#notes{display:none;position:fixed;left:20px;right:20px;bottom:75px;padding:20px;background:white;z-index:2;line-height:1.6}@page{size:13.333333in 7.5in;margin:0}@media print{body{background:white}.page{width:1280px;height:720px;margin:0;break-after:page}.page:last-of-type{break-after:auto}.slide{transform:none}nav,#notes{display:none!important}}</style></head><body>${htmlSlides.join('')}<aside id="notes"></aside><nav><a href="BioAgent-framework-ja.html">JA</a><a href="BioAgent-framework-en.html">EN</a><button id="prev">←</button><span id="count"></span><button id="next">→</button><button id="show-notes">Notes</button><a href="BioAgent-framework-${lang}.pdf">PDF</a><a href="BioAgent-framework-${lang}.pptx">PPTX</a><a href="findings-ja-en.md">Q&A</a></nav><script>const pages=[...document.querySelectorAll('.slide')];let current=0;function go(i){current=Math.max(0,Math.min(2,i));pages[current].scrollIntoView({block:'start'});document.querySelector('#count').textContent=(current+1)+' / 3';document.querySelector('#notes').textContent=pages[current].dataset.notes}document.querySelector('#prev').onclick=()=>go(current-1);document.querySelector('#next').onclick=()=>go(current+1);document.querySelector('#show-notes').onclick=()=>{const n=document.querySelector('#notes');n.style.display=n.style.display==='block'?'none':'block'};document.addEventListener('keydown',e=>{if(e.key==='ArrowRight')go(current+1);if(e.key==='ArrowLeft')go(current-1)});function resize(){document.documentElement.style.setProperty('--scale',Math.min(1,(innerWidth-28)/1280))}window.addEventListener('resize',resize);resize();go(0);</script></body></html>`;
    await fs.writeFile(base + '.html', html);
    const page = await browser.newPage({ viewport: { width: 1330, height: 800 } }),
      errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(pathToFileURL(base + '.html').href);
    await page.evaluate(() => document.fonts.ready);
    await page.locator('#next').click();
    const navigation = (await page.locator('#count').innerText()) === '2 / 3';
    await page.locator('#show-notes').click();
    const notesVisible = await page.locator('#notes').isVisible();
    await page.locator('#show-notes').click();
    const overflow = await page.evaluate(() =>
      [...document.querySelectorAll('.txt')].flatMap((e) => {
        const b = e.getBoundingClientRect(),
          r = document.createRange();
        r.selectNodeContents(e);
        const t = r.getBoundingClientRect();
        return t.right > b.right + 2 || t.bottom > b.bottom + 2
          ? [{ text: e.textContent, dx: t.right - b.right, dy: t.bottom - b.bottom }]
          : [];
      }),
    );
    await page.pdf({ path: base + '.pdf', preferCSSPageSize: true, printBackground: true });
    await page.addStyleTag({ content: 'nav,#notes{display:none!important}' });
    for (let i = 0; i < 3; i++)
      await page
        .locator(`#slide-${i + 1}`)
        .screenshot({ path: path.join(out, `slide-${lang}-${i + 1}.png`) });
    validation.languages[lang] = {
      slides: 3,
      overflow,
      errors,
      navigation,
      notesVisible,
      speechLength: lang === 'en' ? notes.join(' ').split(/\s+/).length : notes.join('').length,
    };
    await page.close();
  }
} finally {
  await browser.close();
}
validation.passed = Object.values(validation.languages).every(
  (l) => !l.overflow.length && !l.errors.length && l.navigation && l.notesVisible,
);
await fs.writeFile(path.join(out, 'slide-validation.json'), JSON.stringify(validation, null, 2) + '\n');
console.log(JSON.stringify(validation, null, 2));
if (!validation.passed) process.exitCode = 1;
