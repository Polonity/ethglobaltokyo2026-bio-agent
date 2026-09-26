import {
  initialPolicy,
  validatePolicy,
  foragerBinding,
  fitReadout,
  evaluatePolicy,
  makeEpisode,
  advanceEpisode,
} from '../../bio_agent/research/adaptive-forager.js';
import { defaultAquaPolicy, validateAquaPolicy } from '../../training/browser/aqua-learning.js';
import { neuralSignal, MALE_CNS } from '../../bio_agent/connectome/male-cns.js';
import { random } from '../../bio_agent/browser/arena.js';

function validateStatus(s) {
  if (
    ![0, 1, 2].includes(s?.activity) ||
    !['energy', 'stimulus'].every((k) => Number.isInteger(s[k]) && s[k] >= 0 && s[k] <= 10000)
  )
    throw Error('Invalid BioAgent status');
}
export class ForagingBackend {
  constructor({ seed = 310001, encoder = 'malecns', minimumFinalEnergy = null } = {}) {
    this.binding = foragerBinding(encoder);
    this.encoder = encoder;
    this.episode = makeEpisode(seed);
    if (
      minimumFinalEnergy !== null &&
      (!Number.isFinite(minimumFinalEnergy) || minimumFinalEnergy < 0 || minimumFinalEnergy > 1)
    )
      throw Error('Invalid energy floor');
    this.minimumFinalEnergy = minimumFinalEnergy;
    if (minimumFinalEnergy !== null)
      this.binding.adoptionGate = `foraging-energy-floor-v1:${minimumFinalEnergy}`;
  }
  initial() {
    return { ...initialPolicy(), encoder: this.encoder };
  }
  validate(p) {
    validatePolicy(p);
    if (p.encoder !== this.encoder) throw Error('Wrong encoder');
  }
  fit(p, c) {
    return fitReadout(p, c);
  }
  evaluate(p, c) {
    return evaluatePolicy(p, c.seeds, c.profiles, c.ticks);
  }
  gate(before, after) {
    const checks = before.map((p, i) => ({
      profile: p.profile,
      passed:
        after[i].metrics.reward > p.metrics.reward + 0.01 &&
        after[i].metrics.food >= p.metrics.food &&
        after[i].metrics.contacts <= p.metrics.contacts &&
        (this.minimumFinalEnergy === null || after[i].metrics.finalEnergy >= this.minimumFinalEnergy),
      minimumFinalEnergy: this.minimumFinalEnergy,
      candidateFinalEnergy: after[i].metrics.finalEnergy,
      rewardDelta: after[i].metrics.reward - p.metrics.reward,
      contactDelta: after[i].metrics.contacts - p.metrics.contacts,
    }));
    return {
      passed: checks.length > 0 && checks.every((c) => c.passed),
      rule: 'reward increases; food and contacts do not worsen in every selection profile; optional final energy floor',
      checks,
    };
  }
  observe(status) {
    validateStatus(status);
    Object.assign(this.episode.world, {
      mode: ['rest', 'explore', 'forage'][status.activity],
      energy: status.energy / 10000,
      stimulus: status.stimulus / 10000,
    });
  }
  step(p) {
    return advanceEpisode(this.episode, p);
  }
  snapshot() {
    return structuredClone({
      time: this.episode.ticks * 0.2,
      actor: this.episode.actor,
      world: this.episode.world,
      metrics: this.episode.metrics,
    });
  }
}

// Separate task engine: calibration of a synthetic Aqua risk response, no market claims.
export class AquaBackend {
  constructor({ agentId = 1 } = {}) {
    if (![1, 2, 3].includes(agentId)) throw Error('Invalid Aqua agent');
    this.agentId = agentId;
    this.risk = 0;
    this.ticks = 0;
    this.binding = {
      task: 'aqua-calibration',
      model: MALE_CNS.graphSha256,
      encoder: `aqua-sensitivity-${agentId}-v1`,
      dynamics: 'circuit-32-quantized-v1',
      readout: 'aqua-gain-v1',
      actionSpace: 'ship-cautious-dock-v1',
    };
  }
  initial() {
    return defaultAquaPolicy();
  }
  validate(p) {
    validateAquaPolicy(p);
  }
  response(risk) {
    return neuralSignal(Math.min(1, risk * [0.7, 1, 1.3][this.agentId - 1])).response;
  }
  samples(seeds) {
    return seeds.flatMap((seed) => {
      const rng = random(seed);
      return Array.from({ length: 32 }, () => {
        const risk = rng();
        return { x: this.response(risk), y: risk * 0.24 };
      });
    });
  }
  fit(p, c) {
    const samples = this.samples(c.seeds);
    const xx = samples.reduce((s, r) => s + r.x * r.x, 0),
      xy = samples.reduce((s, r) => s + r.x * r.y, 0);
    return {
      policy: { ...p, gain: Math.max(0.5, Math.min(2, xy / (xx + 1e-9))), report: null },
      training: {
        seeds: c.seeds,
        samples: samples.length,
        method: 'least-squares-gain',
        target: 'synthetic-risk-times-0.24',
      },
    };
  }
  evaluate(p, c) {
    const samples = this.samples(c.seeds);
    return {
      mse: samples.reduce((s, r) => s + (r.x * p.gain - r.y) ** 2, 0) / samples.length,
      samples: samples.length,
    };
  }
  gate(before, after) {
    return { passed: after.mse < before.mse - 1e-10, rule: 'selection MSE decreases; synthetic target only' };
  }
  observe(status) {
    validateStatus(status);
    this.risk = status.stimulus / 10000;
  }
  step(p) {
    this.ticks++;
    const rawResponse = this.response(this.risk),
      response = rawResponse * p.gain;
    return {
      rawResponse,
      response,
      action: rawResponse >= 0.1 || response >= 0.1 ? 'dock' : response >= 0.045 ? 'cautious' : 'ship',
    };
  }
  snapshot() {
    return { time: this.ticks * 0.2, risk: this.risk };
  }
}
