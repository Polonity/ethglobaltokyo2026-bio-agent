// Adaptive simulation model. This is not a MaleCNS connectome simulation.
export const MODEL = 'foraging-q-v1';
export const WIDTH = 36;
export const HEIGHT = 22;
export const DIRECTIONS = Array.from({ length: 8 }, (_, i) => [
  Math.cos((i * Math.PI) / 4),
  Math.sin((i * Math.PI) / 4),
]).concat([[0, 0]]);
export const COLORS = [
  '#ed754a',
  '#76ae8f',
  '#b394d6',
  '#e4bb58',
  '#67aaca',
  '#d887a9',
  '#b7bd70',
  '#edaa75',
  '#8794d6',
  '#73bdb7',
  '#c48973',
  '#bac1cb',
];
export const NAMES = [
  'MOMO',
  'SORA',
  'KIKI',
  'HACHI',
  'NOVA',
  'YUZU',
  'RIN',
  'FUKU',
  'LUNA',
  'AO',
  'NIKO',
  'TOTO',
];
export function random(seed) {
  let n = seed >>> 0;
  return () => {
    n += 0x6d2b79f5;
    let t = Math.imul(n ^ (n >>> 15), 1 | n);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
function bearing(dx, dy) {
  return (Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) + 8) % 8;
}
export function createWorld(rng) {
  return {
    foods: Array.from({ length: 6 }, (_, id) => ({ id, x: 3 + rng() * 30, y: 3 + rng() * 16 })),
    hazards: [
      { x: 12, y: 8, radius: 2.2 },
      { x: 25, y: 15, radius: 2.4 },
    ],
    stimulus: 0.55,
    energy: 0.7,
    mode: 'forage',
  };
}
function observe(fly, world) {
  const target = world.foods.reduce((a, b) => (distance(fly, a) < distance(fly, b) ? a : b));
  const direction = bearing(target.x - fly.x, target.y - fly.y);
  let mask = 0;
  DIRECTIONS.slice(0, 8).forEach(([dx, dy], a) => {
    const p = { x: fly.x + dx, y: fly.y + dy };
    if (
      world.hazards.some((h) => distance(p, h) < h.radius + 0.4) ||
      p.x < 1 ||
      p.x > WIDTH - 1 ||
      p.y < 1 ||
      p.y > HEIGHT - 1
    )
      mask |= 1 << a;
  });
  return { key: `${direction}:${mask}:${fly.energy < 0.2 ? 1 : 0}`, target, direction, mask };
}
function values(q, observation) {
  if (!q[observation.key]) {
    // Weak shared instinct; experience adjusts the action values during learning.
    q[observation.key] = DIRECTIONS.map((_, a) =>
      a === 8 ? -0.15 : Math.cos(((a - observation.direction) * Math.PI) / 4) * 0.14,
    );
  }
  return q[observation.key];
}
function choose(q, observation, rng, epsilon) {
  const row = values(q, observation);
  if (rng() < epsilon) return Math.floor(rng() * 9);
  return row.indexOf(Math.max(...row));
}
function transition(fly, world, action, rng) {
  const before = observe(fly, world);
  const oldDistance = distance(fly, before.target);
  const [dx, dy] = DIRECTIONS[action];
  const speed = fly.energy < 0.12 ? 0.45 : 0.9;
  fly.x = clamp(fly.x + dx * speed, 0.7, WIDTH - 0.7);
  fly.y = clamp(fly.y + dy * speed, 0.7, HEIGHT - 0.7);
  if (action < 8) fly.heading = (action * Math.PI) / 4;
  const hit = world.hazards.some((h) => distance(fly, h) < h.radius);
  let reward = (oldDistance - distance(fly, before.target)) * 0.3 - 0.03;
  if (hit) reward -= 1.2 + world.stimulus;
  fly.energy = clamp(
    fly.energy +
      (action === 8 ? 0.055 + world.energy * 0.015 : -0.012 + world.energy * 0.006) -
      (hit ? 0.014 : 0),
    0,
    1,
  );
  if (fly.energy < 0.15 && action === 8) reward += 0.18;
  let collected = false;
  if (distance(fly, before.target) < 1.1) {
    collected = true;
    reward += 5;
    fly.energy = Math.min(1, fly.energy + 0.22);
    before.target.x = 2 + rng() * (WIDTH - 4);
    before.target.y = 2 + rng() * (HEIGHT - 4);
  }
  const after = observe(fly, world);
  return { state: before.key, action, reward, next: after.key, collected, hit, observation: before };
}
function learn(q, t) {
  const init = (key) => {
    const [direction, mask] = key.split(':').map(Number);
    return values(q, { key, direction, mask });
  };
  const row = init(t.state);
  const next = init(t.next);
  const delta = t.reward + 0.6 * Math.max(...next) - row[t.action];
  row[t.action] += 0.09 * delta;
  return Math.abs(delta);
}
function clone(q) {
  return JSON.parse(JSON.stringify(q));
}
// Same private benchmark seeds for before/after, never used for fitting.
export function evaluate(q) {
  const policy = clone(q);
  let total = 0;
  for (const seed of [90001, 90019, 90103]) {
    const rng = random(seed);
    const world = createWorld(rng);
    const fly = { x: 3 + rng() * 30, y: 3 + rng() * 16, energy: 0.7 };
    for (let tick = 0; tick < 100; tick++) {
      const obs = observe(fly, world);
      const t = transition(fly, world, choose(policy, obs, rng, 0), rng);
      total += t.reward;
    }
  }
  return total / 3;
}
export class Arena {
  constructor(seed = 2026) {
    this.seed = seed;
    this.rng = random(seed);
    this.world = createWorld(this.rng);
    this.time = 0;
    this.duration = 90;
    this.round = 1;
    this.paused = false;
    this.finished = false;
    this.autoLearn = true;
    this.revision = 0;
    this.lastSelection = 0;
    this.events = [];
    this.selected = 0;
    this.flies = NAMES.map((name, id) => ({
      id,
      name,
      color: COLORS[id],
      x: 3 + this.rng() * 30,
      y: 3 + this.rng() * 16,
      heading: this.rng() * Math.PI * 2,
      energy: 0.7,
      score: 0,
      collisions: 0,
      q: {},
      memory: [],
      state: 'racing',
      version: 1,
      training: null,
      trainingCount: 0,
      lastTraining: -30,
      exploration: 0.12 + id * 0.025,
      lastDecision: '蜜の匂いを探索',
      trail: [],
      activeTicks: 0,
    }));
    this.log('system', 'FIELD OPEN', '12体のハエが蜜の探索を開始');
  }
  log(kind, title, detail, flyId = null) {
    this.events.unshift({ id: ++this.revision, time: this.time, kind, title, detail, flyId });
    this.events = this.events.slice(0, 40);
  }
  applyStatus({ stimulus, energy, mode }) {
    this.world.stimulus = clamp(stimulus, 0, 1);
    this.world.energy = clamp(energy, 0, 1);
    this.world.mode = ['forage', 'explore', 'rest'].includes(mode) ? mode : 'forage';
    this.log(
      'input',
      'STATUS APPLIED',
      `刺激 ${Math.round(stimulus * 100)}% / エネルギー供給 ${Math.round(energy * 100)}% / ${this.world.mode}`,
    );
  }
  addFood(x, y) {
    const oldest = this.world.foods.shift();
    this.world.foods.push({ ...oldest, x: clamp(x, 1, WIDTH - 1), y: clamp(y, 1, HEIGHT - 1) });
    this.log('input', 'NECTAR PLACED', 'クリック位置に蜜を配置。ハエが匂いに反応');
  }
  startTraining(fly) {
    if (fly.state === 'learning' || this.finished) return false;
    const rng = random(this.seed + fly.id * 7109 + (fly.trainingCount + 1) * 101);
    fly.state = 'learning';
    fly.trainingCount++;
    fly.lastTraining = this.time;
    fly.training = {
      elapsed: 0,
      steps: 0,
      episodes: 0,
      error: 0,
      candidate: clone(fly.q),
      before: evaluate(fly.q),
      rng,
      world: createWorld(rng),
      actor: { x: 3 + rng() * 30, y: 3 + rng() * 16, energy: 0.7 },
    };
    this.log('learning', `${fly.name} → LEARNING`, `${fly.memory.length}件の経験から方策を更新`, fly.id);
    return true;
  }
  trainTick(fly, dt) {
    const t = fly.training;
    t.elapsed += dt;
    for (let i = 0; i < 96; i++) {
      const obs = observe(t.actor, t.world);
      const item = transition(t.actor, t.world, choose(t.candidate, obs, t.rng, 0.28), t.rng);
      t.error = learn(t.candidate, item);
      if (fly.memory.length) learn(t.candidate, fly.memory[Math.floor(t.rng() * fly.memory.length)]);
      t.steps++;
      if (t.steps % 100 === 0) {
        t.episodes++;
        t.world = createWorld(t.rng);
        t.actor = { x: 2 + t.rng() * 32, y: 2 + t.rng() * 18, energy: 0.7 };
      }
    }
    if (t.elapsed >= 8) {
      const after = evaluate(t.candidate);
      const accepted = after > t.before + 0.01;
      if (accepted) {
        fly.q = t.candidate;
        fly.version++;
      }
      fly.lastReport = { before: t.before, after, accepted, steps: t.steps };
      fly.state = 'racing';
      // Restoring energy is an explicit rest benefit, independent of policy improvement.
      fly.energy = Math.max(0.65, fly.energy);
      fly.lastDecision = 'フィールドに復帰';
      this.log(
        'return',
        `${fly.name} → RETURN`,
        `${t.before.toFixed(1)} → ${after.toFixed(1)} / ${accepted ? `方策 v${fly.version} を採用` : '既存の方策を維持'}`,
        fly.id,
      );
    }
  }
  tick(dt = 0.2) {
    if (this.paused || this.finished) return;
    this.time += dt;
    for (const fly of this.flies) {
      if (fly.state === 'learning') {
        this.trainTick(fly, dt);
        continue;
      }
      const obs = observe(fly, this.world);
      let action = choose(fly.q, obs, this.rng, fly.exploration + this.world.stimulus * 0.09);
      if (this.world.mode === 'rest' && this.rng() < 0.75) action = 8;
      if (this.world.mode === 'explore' && this.rng() < 0.4) action = Math.floor(this.rng() * 8);
      if (fly.energy < 0.08) action = 8;
      const result = transition(fly, this.world, action, this.rng);
      fly.memory.push({ state: result.state, action, reward: result.reward, next: result.next });
      if (fly.memory.length > 300) fly.memory.shift();
      fly.activeTicks++;
      fly.score += result.collected ? 1 : 0;
      fly.collisions += result.hit ? 1 : 0;
      fly.lastDecision =
        action === 8
          ? '休息してエネルギー回復'
          : result.hit
            ? '危険刺激を検知'
            : result.collected
              ? '蜜を獲得 +1'
              : `${['東', '南東', '南', '南西', '西', '北西', '北', '北東'][action]}へ移動`;
      fly.observation = { bearing: obs.direction, danger: Boolean(obs.mask), energy: fly.energy };
      fly.trail.push({ x: fly.x, y: fly.y });
      if (fly.trail.length > 16) fly.trail.shift();
    }
    if (this.autoLearn && this.time - this.lastSelection >= 18 && this.time < this.duration - 10) {
      this.lastSelection = this.time;
      const candidates = this.flies.filter((f) => f.state === 'racing' && this.time - f.lastTraining >= 28);
      candidates.sort(
        (a, b) =>
          a.score / Math.max(1, a.activeTicks) - b.score / Math.max(1, b.activeTicks) ||
          b.collisions - a.collisions,
      );
      candidates.slice(0, 2).forEach((f) => this.startTraining(f));
    }
    if (this.time >= this.duration) {
      this.time = this.duration;
      this.finished = true;
      const winner = this.ranking()[0];
      this.log('system', `${winner.name} WINS`, `${winner.score} nectar / ラウンド ${this.round} 終了`);
    }
  }
  ranking() {
    return [...this.flies].sort((a, b) => b.score - a.score || a.collisions - b.collisions);
  }
  nextRound() {
    this.round++;
    this.time = 0;
    this.lastSelection = 0;
    this.finished = false;
    this.paused = false;
    this.flies.forEach((f) => {
      f.score = 0;
      f.collisions = 0;
      f.activeTicks = 0;
      f.state = 'racing';
      f.energy = 0.7;
      f.training = null;
      f.lastTraining = -30;
      f.trail = [];
      f.x = 3 + this.rng() * 30;
      f.y = 3 + this.rng() * 16;
    });
    this.log('system', 'NEXT ROUND', '学習した方策を引き継いで次の競争へ');
  }
}
