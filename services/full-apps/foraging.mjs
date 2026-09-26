import { emptyTxWorld, applyTxWorld } from '../../packages/bio_agent/browser/tx-world.js';
import { addTxFood, consumeFood } from '../../packages/bio_agent/browser/tx-food.js';
import { createWorld, random, DIRECTIONS } from '../../packages/bio_agent/browser/arena.js';
import { bodyStep, ensureBody } from '../../packages/bio_agent/browser/body.js';
// Same arena dimensions, rewards and synthetic body as the existing browser game.
// Neural decisions live in BrainClient; this class only observes and applies actions.
const clamp = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
export class ForagingEnvironment {
  constructor(seed = 2026, { txFood = false } = {}) {
    this.seed = seed;
    this.rng = random(seed);
    this.world = txFood ? emptyTxWorld() : createWorld(this.rng);
    this.tick = 0;
    this.flies = Array.from({ length: 2 }, (_, id) => ({
      id,
      name: ['MOMO', 'SORA'][id],
      x: 3 + this.rng() * 30,
      y: 3 + this.rng() * 16,
      energy: 0.7,
      score: 0,
      collisions: 0,
      reward: 0,
      heading: 0,
    }));
    this.flies.forEach(ensureBody);
  }
  applyWorld(event) {
    if (!applyTxWorld(this.world, event)) return false;
    this.seed = this.world.seed;
    this.rng = random(this.seed);
    for (const f of this.flies) {
      f.x = 2 + this.rng() * (this.world.width - 4);
      f.y = 2 + this.rng() * (this.world.height - 4);
    }
    return true;
  }
  addStimulus(event) {
    addTxFood(this.world, event);
  }
  observe() {
    if (this.world.foodMode === 'confirmed-tx' && !this.world.worldSource)
      throw Error('Confirmed environment required');
    return this.flies.map((f) => {
      const target = this.world.foods.reduce((a, b) => (!a || distance(f, b) < distance(f, a) ? b : a), null);
      const direction = target
        ? (Math.round(Math.atan2(target.y - f.y, target.x - f.x) / (Math.PI / 4)) + 8) % 8
        : 0;
      let mask = 0;
      DIRECTIONS.slice(0, 8).forEach(([dx, dy], i) => {
        const p = { x: f.x + dx, y: f.y + dy };
        if (
          this.world.hazards.some((h) => distance(p, h) < h.radius + 0.4) ||
          p.x < 1 ||
          p.x > this.world.width - 1 ||
          p.y < 1 ||
          p.y > this.world.height - 1
        )
          mask |= 1 << i;
      });
      const actionDrives = Array.from({ length: 9 }, (_, a) =>
        a === 8
          ? Math.min(1, Math.max(f.satiety, (1 - f.energy) * 0.7, this.world.mode === 'rest' ? 1 : 0))
          : clamp(
              (0.5 + 0.5 * Math.cos(((a - direction) * Math.PI) / 4)) *
                (1 - f.satiety * 0.75) *
                (mask & (1 << a) ? 0.05 : 1) *
                (this.world.mode === 'rest' ? 0.05 : 1) *
                (1 - this.world.stimulus * 0.15),
            ),
      );
      return {
        x: f.x,
        y: f.y,
        target: target ? { ...target } : null,
        direction,
        mask,
        energy: f.energy,
        satiety: f.satiety,
        reserves: f.reserves,
        drives: [
          ...actionDrives,
          f.energy,
          f.satiety,
          f.reserves,
          this.world.stimulus,
          this.world.energy,
          target ? Math.min(1, distance(f, target) / 30) : 0,
          1,
        ],
        allowed: f.energy < 0.08 || !target ? [8] : [0, 1, 2, 3, 4, 5, 6, 7, 8],
      };
    });
  }
  apply(actions) {
    const results = [];
    for (const [i, f] of this.flies.entries()) {
      // Re-observe for each actor: the earlier actor may have relocated collected food.
      const before = this.observe()[i],
        target = this.world.foods.find((t) => t.id === before.target?.id);
      const oldDistance = target ? distance(f, target) : 0,
        action = target ? actions[i] : 8;
      if (!before.allowed.includes(action)) throw Error('Foraging action is not allowed');
      const [dx, dy] = DIRECTIONS[action],
        speed = f.energy < 0.12 ? 0.45 : 0.9;
      f.x = clamp(f.x + dx * speed, 0.7, this.world.width - 0.7);
      f.y = clamp(f.y + dy * speed, 0.7, this.world.height - 0.7);
      if (action < 8) f.heading = (action * Math.PI) / 4;
      const hit = this.world.hazards.some((h) => distance(f, h) < h.radius);
      let reward = (target ? oldDistance - distance(f, target) : 0) * 0.3 - 0.03;
      if (hit) reward -= 1.2 + this.world.stimulus;
      f.energy = clamp(
        f.energy +
          (action === 8 ? 0.055 + this.world.energy * 0.015 : -0.012 + this.world.energy * 0.006) -
          (hit ? 0.014 : 0),
      );
      if (f.energy < 0.15 && action === 8) reward += 0.18;
      const collected = Boolean(target && distance(f, target) < 1.1);
      if (collected) {
        reward += 5 * (1 - f.satiety * 0.8);
        f.energy = Math.min(1, f.energy + 0.22);
        consumeFood(this.world, target, this.rng);
      }
      bodyStep(f, { fed: collected, resting: action === 8 });
      f.score += Number(collected);
      f.collisions += Number(hit);
      f.reward += reward;
      results.push({
        reward,
        metrics: {
          action,
          collected,
          hit,
          x: f.x,
          y: f.y,
          energy: f.energy,
          satiety: f.satiety,
          score: f.score,
        },
      });
    }
    this.tick++;
    return results;
  }
  snapshot() {
    return { app: 'foraging', seed: this.seed, tick: this.tick, world: this.world, flies: this.flies };
  }
}
