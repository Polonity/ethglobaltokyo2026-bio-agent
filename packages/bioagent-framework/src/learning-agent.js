import { IBioAgentRuntime } from '../../bio_agent/runtime/agents.js';

const copy = (value) => structuredClone(value);
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
export async function digest(value) {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return '0x' + [...new Uint8Array(hash)].map((x) => x.toString(16).padStart(2, '0')).join('');
}
function validSeeds(seeds) {
  if (
    !Array.isArray(seeds) ||
    !seeds.length ||
    seeds.length > 256 ||
    new Set(seeds).size !== seeds.length ||
    seeds.some((s) => !Number.isSafeInteger(s) || s < 0 || s > 0xffffffff)
  )
    throw Error('Distinct uint32 scenario seeds required');
}
// Common lifecycle for different task engines. Solidity IBioAgent remains unchanged.
export class LearningBioAgent extends IBioAgentRuntime {
  #backend;
  #policy;
  #version = 1;
  #generation = 0;
  #candidate = null;
  #evaluation = null;
  #binding;
  constructor(identity, backend) {
    super(identity);
    this.#backend = backend;
    this.#binding = copy(backend.binding);
    this.kind = `learning-${backend.binding.task}-v1`;
    this.#policy = copy(backend.initial());
    backend.validate(this.#policy);
  }
  get binding() {
    return copy(this.#binding);
  }
  get policy() {
    return copy(this.#policy);
  }
  get version() {
    return this.#version;
  }
  get candidate() {
    return copy(this.#candidate);
  }
  train(config) {
    validSeeds(config.seeds);
    const result = this.#backend.fit(copy(this.#policy), copy(config));
    this.#backend.validate(result.policy);
    this.#candidate = {
      baseGeneration: this.#generation,
      policy: copy(result.policy),
      training: copy(result.training),
      trainingSeeds: [...config.seeds],
    };
    this.#evaluation = null;
    return this.candidate;
  }
  evaluate(config) {
    if (!this.#candidate) throw Error('Train a candidate first');
    validSeeds(config.seeds);
    if (config.seeds.some((s) => this.#candidate.trainingSeeds.includes(s)))
      throw Error('Selection scenarios overlap training');
    const before = this.#backend.evaluate(copy(this.#policy), copy(config));
    const after = this.#backend.evaluate(copy(this.#candidate.policy), copy(config));
    const gate = this.#backend.gate(before, after);
    this.#evaluation = { before, after, gate, scenarios: copy(config), baseGeneration: this.#generation };
    return copy(this.#evaluation);
  }
  adopt() {
    if (!this.#candidate || !this.#evaluation) throw Error('Evaluated candidate required');
    if (
      this.#candidate.baseGeneration !== this.#generation ||
      this.#evaluation.baseGeneration !== this.#generation
    )
      throw Error('Stale candidate');
    const accepted = this.#evaluation.gate.passed === true;
    const report = { accepted, previousVersion: this.#version, ...copy(this.#evaluation) };
    if (accepted) {
      this.#policy = copy(this.#candidate.policy);
      this.#version++;
      this.#generation++;
    }
    this.#candidate = null;
    this.#evaluation = null;
    return { ...report, version: this.#version };
  }
  async exportPolicy() {
    const payload = {
      schema: 'bioagent.framework-policy.v1',
      identity: copy(this.identity),
      binding: this.binding,
      version: this.#version,
      policy: copy(this.#policy),
    };
    return { ...payload, sha256: await digest(payload) };
  }
  async restorePolicy(artifact) {
    // Copy before awaiting the digest so caller mutation cannot change a validated artifact.
    const { sha256, ...payload } = copy(artifact);
    if (
      payload.schema !== 'bioagent.framework-policy.v1' ||
      !same(payload.identity, this.identity) ||
      !same(payload.binding, this.#binding) ||
      !Number.isSafeInteger(payload.version) ||
      payload.version < 1
    )
      throw Error('Incompatible policy identity, task, model or mapping');
    if ((await digest(payload)) !== sha256) throw Error('Policy digest mismatch');
    this.#backend.validate(payload.policy);
    this.#policy = copy(payload.policy);
    this.#version = payload.version;
    this.#generation++;
    this.#candidate = null;
    this.#evaluation = null;
    return this.snapshot();
  }
  observe(input) {
    this.#backend.observe(copy(input));
    this.lastInput = copy(input);
    return true;
  }
  step(dt = 0.2) {
    if (dt !== 0.2) throw Error('Tick must be exactly 0.2 seconds');
    return { ...this.#backend.step(copy(this.#policy), dt), policyVersion: this.#version };
  }
  snapshot() {
    return {
      identity: copy(this.identity),
      kind: this.kind,
      binding: this.binding,
      version: this.#version,
      lastInput: copy(this.lastInput),
      runtime: this.#backend.snapshot(),
    };
  }
}
