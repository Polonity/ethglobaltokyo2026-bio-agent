import fs from 'node:fs/promises';
import {
  makeEpisode,
  advanceEpisode,
  initialPolicy,
} from '../../../packages/bio_agent/research/adaptive-forager.js';
const out = 'artifacts/bioagent-adaptation-20260926',
  r = JSON.parse(await fs.readFile(`${out}/experiment.json`, 'utf8'));
const p = r.protocol,
  rows = [];
for (const record of r.records.filter((x) => x.encoder === 'malecns'))
  for (const profile of [...p.profiles, p.stressProfile])
    for (const variant of ['before', 'after']) {
      const episodes = [];
      for (let i = 0; i < p.testSeedRule.count; i++) {
        const seed = p.testSeedRule.start + i * p.testSeedRule.stride,
          e = makeEpisode(seed, profile);
        let lowEnergyTicks = 0;
        for (let tick = 0; tick < p.episodeTicks; tick++) {
          advanceEpisode(e, variant === 'before' ? initialPolicy() : record.artifact.policy);
          lowEnergyTicks += Number(e.actor.energy < 0.12);
        }
        episodes.push({
          seed,
          lowEnergyTicks,
          finalEnergy: e.actor.energy,
          finalSatiety: e.actor.satiety,
          finalReserves: e.actor.reserves,
        });
      }
      rows.push({ trainingSeed: record.seed, profile: profile.name, variant, episodes });
    }
const summary = [];
for (const profile of [...p.profiles, p.stressProfile])
  for (const variant of ['before', 'after']) {
    const es = rows
      .filter((x) => x.profile === profile.name && x.variant === variant)
      .flatMap((x) => x.episodes);
    summary.push({
      profile: profile.name,
      variant,
      ...Object.fromEntries(
        ['lowEnergyTicks', 'finalEnergy', 'finalSatiety', 'finalReserves'].map((k) => [
          k,
          es.reduce((s, e) => s + e[k], 0) / es.length,
        ]),
      ),
    });
  }
await fs.writeFile(
  `${out}/body-audit.json`,
  JSON.stringify(
    {
      role: 'Exploratory side-effect audit added after primary results; no model selection or parameter changes',
      summary,
      rows,
    },
    null,
    2,
  ),
);
console.log(JSON.stringify(summary));
