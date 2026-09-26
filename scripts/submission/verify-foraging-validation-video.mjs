import { JsonRpcProvider } from 'ethers';
import { chromium } from '@playwright/test';
import { readFile, writeFile, copyFile, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
const source = 'artifacts/foraging-validation-video/delivery',
  target = 'docs/submission/presenter-kit';
const evidence = JSON.parse(await readFile(source + '/capture-evidence.json'));
assert.deepEqual(evidence.errors, []);
assert.deepEqual(evidence.after.latest.foraging.result.versions, [2, 2]);
const consumed = evidence.after.latest.foraging.snapshot.world.foodEvents.filter((x) => x.consumed).length;
assert.equal(consumed, 2);
const rpc = new JsonRpcProvider('http://127.0.0.1:18578');
const world = evidence.after.latest.foraging.snapshot.world;
const receipts = [];
try {
  for (const input of [world.worldSource, ...world.foodEvents.map((e) => e.source)]) {
    const receipt = await rpc.getTransactionReceipt(input.transactionHash);
    const block = await rpc.getBlock(Number(input.blockNumber));
    assert.equal(receipt.status, 1);
    assert.equal(receipt.blockHash, input.blockHash);
    assert.equal(block.hash, input.blockHash);
    receipts.push({ hash: receipt.hash, status: receipt.status, blockHash: receipt.blockHash });
  }
} finally {
  rpc.destroy();
}

const server = createServer(async (req, res) => {
  try {
    const name = req.url.slice(1);
    if (!/^bioagent-foraging-validated-(ja|en)\.mp4$/.test(name)) throw Error('Not found');
    res.writeHead(200, { 'Content-Type': 'video/mp4' });
    res.end(await readFile(source + '/' + name));
  } catch {
    res.writeHead(404);
    res.end();
  }
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const browser = await chromium.launch({
  executablePath: '/usr/bin/google-chrome',
  headless: true,
  args: ['--no-sandbox'],
});
try {
  const videos = await Promise.all(
    ['ja', 'en'].map(async (lang) => {
      const name = `bioagent-foraging-validated-${lang}.mp4`,
        file = source + '/' + name;
      execFileSync('ffmpeg', ['-v', 'error', '-i', file, '-f', 'null', '-']);
      const probe = JSON.parse(
        execFileSync('ffprobe', [
          '-v',
          'error',
          '-show_entries',
          'format=duration:stream=codec_name,width,height',
          '-of',
          'json',
          file,
        ]),
      );
      assert(Number(probe.format.duration) < 65);
      assert.equal(probe.streams[0].width, 1920);
      const page = await browser.newPage();
      await page.setContent(
        `<video muted autoplay src="http://127.0.0.1:${server.address().port}/${name}"></video>`,
      );
      const playback = await page.locator('video').evaluate(
        (v) =>
          new Promise((resolve, reject) => {
            v.onended = () => resolve({ ended: v.ended, currentTime: v.currentTime, duration: v.duration });
            v.onerror = () => reject(Error('Decode failed'));
            v.play().catch(reject);
          }),
      );
      assert(playback.ended);
      assert(playback.currentTime > 20);
      await page.close();
      await copyFile(file, target + '/' + name);
      return {
        file: name,
        sha256: createHash('sha256')
          .update(await readFile(file))
          .digest('hex'),
        bytes: (await stat(file)).size,
        fullDecode: true,
        playback,
      };
    }),
  );
  for (const [a, b] of [
    ['capture-evidence.json', 'foraging-video-evidence.json'],
    ['render-metadata.json', 'foraging-render-metadata.json'],
    ['captions-ja.srt', 'foraging-captions-ja.srt'],
    ['captions-en.srt', 'foraging-captions-en.srt'],
  ])
    await copyFile(source + '/' + a, target + '/' + b);
  const r = {
    verifiedAt: new Date().toISOString(),
    videos,
    liveFoodCollected: consumed,
    confirmedInputReceipts: receipts,
    livePolicyVersions: [2, 2],
    visualReview: 'Pending visual inspection of rendered frames',
    source: 'Actual browser run; final slide explicitly presents previously recorded held-out results.',
  };
  await writeFile(target + '/foraging-video-verification.json', JSON.stringify(r, null, 2) + '\n');
  console.log(JSON.stringify(r));
} finally {
  await browser.close();
  await new Promise((r) => server.close(r));
}
