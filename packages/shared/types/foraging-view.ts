import type { AgentRef, ArtifactRef } from './core.ts';
import type { ForagingView } from './foraging.ts';
import { milliseconds, uint, unit } from './primitives.ts';
interface ArenaProjection {
  time: number;
  round: number;
  paused: boolean;
  finished: boolean;
}
interface FlyProjection {
  id: number;
  x: number;
  y: number;
  energy: number;
  satiety: number;
  reserves: number;
  massRatio: number;
  score: number;
  collisions: number;
  state: string;
}
/** Live GUI adapter. This projects real state; it does not claim checkpoint conformance. */
export function foragingView(
  arena: ArenaProjection,
  fly: FlyProjection,
  agent: AgentRef,
  model: ArtifactRef,
  now: number,
): ForagingView {
  if (!Number.isFinite(fly.massRatio) || fly.massRatio <= 0) throw new Error('Invalid body mass');
  return {
    schema: 'bioagent.view.v1',
    agent,
    episodeId: `round-${arena.round}`,
    branchId: 'main',
    clock: {
      tick: uint(String(Math.round(arena.time / 0.2))),
      simulationTimeMs: milliseconds(Math.round(arena.time * 1000)),
      dtMs: milliseconds(200),
      wallTimeMs: milliseconds(now),
      pausePolicy: 'freeze',
    },
    lifecycle: arena.finished
      ? 'finished'
      : arena.paused
        ? 'paused'
        : fly.state === 'learning'
          ? 'training'
          : 'running',
    // World observations are local simulation inputs even when conditions came from chain.
    inputHealth: {
      kind: 'fresh',
      inputId: `world:${arena.round}:${Math.round(arena.time / 0.2)}`,
      sourceTimeMs: milliseconds(Math.round(arena.time * 1000)),
    },
    body: {
      kind: 'embodied',
      model,
      activityEnergy: unit(fly.energy),
      satiety: unit(fly.satiety),
      reserves: unit(fly.reserves),
      massRatio: fly.massRatio,
    },
    applicationState: {
      position: { x: fly.x, y: fly.y },
      score: fly.score,
      collectedCount: uint(String(fly.score)),
      collisionCount: uint(String(fly.collisions)),
    },
  };
}
