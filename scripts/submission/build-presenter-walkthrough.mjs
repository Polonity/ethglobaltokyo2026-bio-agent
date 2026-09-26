import { writeFile, mkdir, readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { walkthroughFor } from './presenter-walkthrough.mjs';
import { architecture } from './presenter-architecture.mjs';
const require = createRequire(import.meta.url);
const PptxGenJS = require(
  process.env.PPTXGENJS_PATH ||
    '/mnt/c/Users/hiken/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/pptxgenjs',
);
const dir = 'docs/submission/presenter-kit';
const walkthrough = walkthroughFor(JSON.parse(await readFile(`${dir}/capture-evidence.json`, 'utf8')));
const out = 'artifacts/submission-presenter-current';
await mkdir(out, { recursive: true });
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome',
  args: ['--no-sandbox'],
});
const report = {
  generatedAt: new Date().toISOString(),
  scope: 'Current shared Fly Lab explanation with newly recorded full-foraging and market evidence',
  languages: [],
};
try {
  for (const [lang, g] of Object.entries(walkthrough)) {
    const pptx = new PptxGenJS();
    pptx.layout = 'LAYOUT_WIDE';
    pptx.author = 'BioAgent';
    pptx.subject = g.goal;
    pptx.title = g.title;
    pptx.lang = lang === 'ja' ? 'ja-JP' : 'en-US';
    pptx.theme = { headFontFace: 'Noto Sans CJK JP', bodyFontFace: 'Noto Sans CJK JP', lang: pptx.lang };
    const sections = g.slides
      .map(([tag, title, bullets, boundary, notes], i) => {
        const appendix = i >= 6;
        const a = architecture[lang];
        const pace = appendix
          ? lang === 'ja'
            ? '質疑応答用の付録'
            : 'Appendix for Q&A'
          : `${i * 10}–${(i + 1) * 10}s`;
        const footer = `${i + 1} / ${g.slides.length}    ·    ${pace}    ·    2026-09-26`;
        const s = pptx.addSlide();
        s.background = { color: 'F4F6EF' };
        s.addText(`BIOAGENT  /  ${tag}`, {
          x: 0.6,
          y: 0.42,
          w: 12.1,
          h: 0.3,
          fontSize: 12,
          color: '26735F',
          bold: true,
          margin: 0,
        });
        s.addText(title, {
          x: 0.6,
          y: appendix ? 0.93 : 1.08,
          w: 12.1,
          h: appendix ? 0.7 : 1.1,
          fontSize: lang === 'ja' ? 29 : 31,
          color: '153C38',
          bold: true,
          margin: 0,
          breakLine: false,
        });
        if (!appendix)
          bullets.forEach((v, j) => {
            s.addShape(pptx.ShapeType.rect, {
              x: 0.6,
              y: 2.65 + j * 0.85,
              w: 0.06,
              h: 0.53,
              line: { color: '26735F' },
              fill: { color: '26735F' },
            });
            s.addText(v, {
              x: 0.87,
              y: 2.57 + j * 0.85,
              w: 11.75,
              h: 0.73,
              fontSize: lang === 'ja' ? 20 : 20,
              color: '153C38',
              margin: 0,
            });
          });
        if (appendix) {
          s.addTable(
            [
              a.headers.map((text) => ({ text, options: { bold: true, fill: '26735F', color: 'FFFFFF' } })),
              ...a.rows,
            ],
            {
              x: 0.6,
              y: 1.83,
              w: 12.1,
              h: 4.35,
              colW: [1.85, 2.85, 3.85, 3.55],
              fontFace: 'Noto Sans CJK JP',
              fontSize: lang === 'ja' ? 13 : 12.5,
              color: '153C38',
              border: { type: 'solid', color: 'CBD8CE', pt: 0.6 },
              margin: 0.06,
              valign: 'mid',
              rowH: 0.57,
              autoPage: false,
              fill: 'F4F6EF',
            },
          );
        }
        s.addShape(pptx.ShapeType.rect, {
          x: 0.6,
          y: appendix ? 6.33 : 5.64,
          w: 12.1,
          h: appendix ? 0.47 : 0.88,
          line: { color: 'E4ECE1' },
          fill: { color: 'E4ECE1' },
        });
        s.addText(boundary, {
          x: 0.82,
          y: appendix ? 6.4 : 5.82,
          w: 11.66,
          h: appendix ? 0.28 : 0.48,
          fontSize: appendix ? 10.5 : 15,
          color: '244D43',
          margin: 0,
        });
        s.addText(footer, {
          x: 0.6,
          y: 6.96,
          w: 12.1,
          h: 0.22,
          fontSize: 10,
          color: '607B70',
          margin: 0,
        });
        s.addNotes(
          `${title}\n\n${notes}\n\n${g.pitchTitle}: ${g.pitch}\n\nSources: docs/submission/sepolia-evidence.json; presenter-kit/capture-evidence.json; docs/research/bioagent-adaptation/README.md. Timing is a suggested pace, not measured narration.`,
        );
        const body = appendix
          ? `<table class="architecture-table"><thead><tr>${a.headers.map((x) => `<th>${esc(x)}</th>`).join('')}</tr></thead><tbody>${a.rows.map((row) => `<tr>${row.map((x) => `<td>${esc(x).replaceAll('\n', '<br>')}</td>`).join('')}</tr>`).join('')}</tbody></table>`
          : `<div class="points">${bullets.map((b) => `<p>${esc(b)}</p>`).join('')}</div>`;
        return `<section class="slide${appendix ? ' appendix' : ''}"><div class="tag">BIOAGENT / ${esc(tag)}</div><h1>${esc(title)}</h1>${body}<div class="boundary">${esc(boundary)}</div><footer>${esc(footer)}</footer></section><details><summary>${lang === 'ja' ? '発表者ノート' : 'Speaker notes'}</summary>${esc(notes)}</details>`;
      })
      .join('');
    const html = `<!doctype html><html lang="${lang}"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(g.title)}</title><style>@page{size:1280px 720px;margin:0}*{box-sizing:border-box}body{margin:0;background:#dfe6df;color:#153c38;font-family:'Noto Sans CJK JP',Arial,sans-serif}.slide{position:relative;width:1280px;height:720px;margin:24px auto;background:#f4f6ef;padding:42px 58px;break-after:page}.tag{font-size:17px;letter-spacing:2px;color:#26735f;font-weight:700}h1{font-size:40px;line-height:1.4;margin:40px 0 0;min-height:112px}.points{margin-top:24px}.points p{font-size:28px;line-height:1.5;margin:22px 0;padding-left:22px;border-left:5px solid #26735f}.boundary{position:absolute;left:58px;right:58px;top:548px;padding:20px;background:#e4ece1;font-size:21px;line-height:1.45}footer{position:absolute;bottom:25px;font-size:14px;color:#607b70}details{max-width:1164px;margin:10px auto 28px;line-height:1.7;padding:18px;background:white}nav{padding:14px;text-align:center;background:#153c38;color:white}nav a{color:white;margin:0 12px}@media print{body{background:white}.slide{margin:0}details,nav{display:none}.slide:last-of-type{break-after:auto}}@media screen and (max-width:1280px){.slide{width:100%;height:auto;min-height:620px;padding:28px}h1{font-size:32px;min-height:0;margin-top:24px}.points p{font-size:24px}.boundary{position:static;margin-top:30px;font-size:18px}footer{position:static;margin-top:24px}details{margin:12px}.tag{font-size:14px}}@media screen and (max-width:500px){h1{font-size:27px}.points p{font-size:20px}}.appendix h1{font-size:34px;min-height:0;margin-top:18px}.architecture-table{width:100%;table-layout:fixed;border-collapse:collapse;margin-top:22px;font-size:18px;line-height:1.4}.architecture-table th,.architecture-table td{padding:7px 12px;border:1px solid #cbd8ce;text-align:left;vertical-align:middle}.architecture-table th{background:#26735f;color:white;font-size:17px}.architecture-table th:first-child{width:16%}.architecture-table th:nth-child(2){width:23%}.architecture-table th:nth-child(3){width:32%}.architecture-table th:nth-child(4){width:29%}.appendix .boundary{top:609px;padding:12px 16px;font-size:15px}@media screen and (max-width:740px){.appendix .boundary{position:static}.architecture-table{font-size:13px}.architecture-table th{font-size:12px}.architecture-table th,.architecture-table td{padding:6px 4px}.appendix h1{font-size:27px}}</style><nav><a href="explanation-ja.html">日本語</a><a href="explanation-en.html">English</a><a href="qa-cheatsheet.html">Q&A</a></nav>${sections}</html>`;
    await writeFile(`${dir}/explanation-${lang}.html`, html);
    await pptx.writeFile({ fileName: `${dir}/explanation-${lang}.pptx` });
    await writeFile(
      `${dir}/walkthrough-${lang}.md`,
      `# ${g.title}\n\n## ${g.goalTitle}\n\n${g.goal}\n\n${g.value}\n\n## ${g.pitchTitle}\n\n${g.pitch}\n\n${lang === 'ja' ? '約1分は説明の目安です。TXや学習の完了を1分で保証するものではありません。' : 'One minute is a suggested speaking time, not a guarantee of TX or training completion.'}\n\n## ${g.stepsTitle}\n\n${g.steps.map(([a, b]) => `- **${a}** — ${b}`).join('\n')}\n\n${g.caution}\n\n## ${g.scopeTitle}\n\n${g.scope.map(([a, b]) => `- **${a}** — ${b}`).join('\n')}\n\n${g.slides.map(([tag, title, bs, limit, note], i) => `## ${i + 1}. ${title}\n\n${bs.map((x) => '- ' + x).join('\n')}\n\n**${limit}**\n\n${note}`).join('\n\n')}\n\n[Q&A](qa-cheatsheet-${lang}.md) · [Current TX evidence](../judge-demo-review.md) · [Research](../../research/bioagent-adaptation/README.md) · [Video evidence](capture-evidence.json) · [Architecture / languages](../../architecture${lang === 'ja' ? '.ja' : ''}.md)\n`,
    );
    const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(pathToFileURL(resolve(`${dir}/explanation-${lang}.html`)).href);
    await page.evaluate(() => document.fonts.ready);
    await page.emulateMedia({ media: 'print' });
    const layout = await page.locator('.slide').evaluateAll((nodes) =>
      nodes.map((n) => ({
        overflow: n.scrollHeight - n.clientHeight,
        clearance:
          n.querySelector('.boundary').getBoundingClientRect().top -
          n.querySelector('.points, .architecture-table').getBoundingClientRect().bottom,
        boundaryClearance:
          n.querySelector('footer').getBoundingClientRect().top -
          n.querySelector('.boundary').getBoundingClientRect().bottom,
      })),
    );
    assert(
      layout.every((x) => x.overflow < 2 && x.clearance > 8 && x.boundaryClearance > 8),
      JSON.stringify({ lang, layout }),
    );
    await page.pdf({
      path: `${dir}/explanation-${lang}.pdf`,
      printBackground: true,
      preferCSSPageSize: true,
    });
    for (let i = 0; i < g.slides.length; i++)
      await page
        .locator('.slide')
        .nth(i)
        .screenshot({ path: `${out}/slide-${lang}-${i + 1}.png` });
    await page.emulateMedia({ media: 'screen' });
    await page.setViewportSize({ width: 390, height: 844 });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    assert.deepEqual(errors, []);
    report.languages.push({
      lang,
      slides: g.slides.length,
      mainSlides: 6,
      appendixSlides: 1,
      layout,
      mobileNoOverflow: true,
      browserErrors: errors,
    });
    await page.close();
  }
} finally {
  await browser.close();
}
await writeFile(`${dir}/explanation-verification.json`, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report));
