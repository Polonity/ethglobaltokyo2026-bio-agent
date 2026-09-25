// Topology-derived engineering model, NOT validated neural physiology.
// Source IDs and counts are measured; signs, dynamics and readout are artificial.
export const CIRCUIT_MODEL = 'male-cns-topology-rate-v1';
export function validateGraph(graph) {
  if (graph?.schema !== 'bioagent.male-cns-slice.v1' || graph.dataset !== 'male-cns:v1.0')
    throw new Error('Unsupported graph');
  if (!Array.isArray(graph.nodes) || graph.nodes.length < 2 || graph.nodes.length > 64)
    throw new Error('Invalid graph size');
  const ids = new Set(graph.nodes.map((n) => n.id));
  if (ids.size !== graph.nodes.length || [...ids].some((id) => !/^[1-9]\d*$/.test(id)))
    throw new Error('Invalid neuron IDs');
  if (
    !ids.has(graph.inputNode) ||
    !Array.isArray(graph.readoutNodes) ||
    !graph.readoutNodes.length ||
    new Set(graph.readoutNodes).size !== graph.readoutNodes.length ||
    graph.readoutNodes.some((id) => !ids.has(id) || id === graph.inputNode)
  )
    throw new Error('Invalid channel mapping');
  if (!Array.isArray(graph.edges) || !graph.edges.length || graph.edges.length > 4096)
    throw new Error('Invalid edges');
  const pairs = new Set();
  for (const edge of graph.edges) {
    const key = edge.pre + ':' + edge.post;
    if (
      !ids.has(edge.pre) ||
      !ids.has(edge.post) ||
      !Number.isSafeInteger(edge.count) ||
      edge.count <= 0 ||
      pairs.has(key)
    )
      throw new Error('Invalid connection');
    pairs.add(key);
  }
  return true;
}
export class ConnectomeCircuit {
  constructor(graph) {
    validateGraph(graph);
    this.graph = structuredClone(graph);
    this.identity = JSON.stringify(this.graph);
    this.index = new Map(graph.nodes.map((n, i) => [n.id, i]));
    this.scale = Math.max(...graph.edges.map((e) => e.count));
    this.reset();
  }
  reset() {
    this.activity = this.graph.nodes.map(() => 0);
    this.tick = 0;
  }
  step(stimulus, { ablated = false } = {}) {
    if (!Number.isFinite(stimulus) || stimulus < 0 || stimulus > 1 || typeof ablated !== 'boolean')
      throw new Error('Stimulus outside [0,1]');
    const drive = this.activity.map(() => 0);
    if (!ablated)
      for (const e of this.graph.edges)
        drive[this.index.get(e.post)] += (e.count / this.scale) * this.activity[this.index.get(e.pre)];
    drive[this.index.get(this.graph.inputNode)] += stimulus;
    this.activity = this.activity.map((a, i) => 0.75 * a + 0.25 * Math.tanh(drive[i]));
    this.tick++;
    const response =
      this.graph.readoutNodes.reduce((s, id) => s + this.activity[this.index.get(id)], 0) /
      this.graph.readoutNodes.length;
    return {
      tick: this.tick,
      activity: [...this.activity],
      response,
      action: response >= 0.1 ? 'advance' : 'wait',
    };
  }
  checkpoint() {
    return {
      schema: 'bioagent.circuit-checkpoint.v1',
      model: CIRCUIT_MODEL,
      graph: this.identity,
      tick: this.tick,
      activity: [...this.activity],
    };
  }
  restore(c) {
    if (
      c?.schema !== 'bioagent.circuit-checkpoint.v1' ||
      c.model !== CIRCUIT_MODEL ||
      c.graph !== this.identity ||
      !Number.isSafeInteger(c.tick) ||
      c.tick < 0 ||
      !Array.isArray(c.activity) ||
      c.activity.length !== this.activity.length ||
      c.activity.some((x) => !Number.isFinite(x) || x < 0 || x > 1)
    )
      throw new Error('Invalid circuit checkpoint');
    this.tick = c.tick;
    this.activity = [...c.activity];
  }
}
export function runCircuitTrial(graph, stimulus, steps = 32, ablated = false) {
  if (!Number.isSafeInteger(steps) || steps < 1 || steps > 1000) throw new Error('Invalid trial length');
  const model = new ConnectomeCircuit(graph);
  const trace = Array.from({ length: steps }, () => model.step(stimulus, { ablated }));
  return { model: CIRCUIT_MODEL, stimulus, ablated, trace, final: trace.at(-1) };
}
export async function sha256(bytes) {
  return (
    '0x' +
    [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))]
      .map((x) => x.toString(16).padStart(2, '0'))
      .join('')
  );
}
// Exact-byte integrity of the locally served bundle. This does not authenticate
// the scientific source, prove execution, or fetch the large upstream dataset.
export async function loadCircuitBundle(fetcher = fetch, expectedHash = null) {
  const base = '/models/circuit/';
  const load = async (url) => {
    const r = await fetcher(url);
    if (!r.ok) throw new Error('Circuit artifact unavailable');
    const bytes = await r.arrayBuffer();
    if (bytes.byteLength > 2_000_000) throw new Error('Circuit artifact too large');
    return bytes;
  };
  const bytes = await load(base + 'descriptor.json');
  const descriptorHash = await sha256(bytes);
  if (expectedHash && descriptorHash !== expectedHash) throw new Error('Registered descriptor mismatch');
  const d = JSON.parse(new TextDecoder().decode(bytes));
  if (
    d.schema !== 'bioagent.descriptor.v1' ||
    d.origin?.kind !== 'connectome-derived' ||
    d.origin.dataset?.release !== 'male-cns:v1.0' ||
    d.plasticity?.kind !== 'frozen' ||
    d.bodyModel !== null ||
    !Array.isArray(d.validationClaims) ||
    d.validationClaims.length
  )
    throw new Error('Unsupported circuit descriptor');
  const results = new Map();
  for (const ref of [d.origin.graph, d.origin.extraction, d.dynamics, d.sensoryMapping, d.motorMapping]) {
    if (
      !ref?.uri?.startsWith(base) ||
      !/^\/models\/circuit\/[a-z0-9.-]+$/.test(ref.uri) ||
      ref.digest?.algorithm !== 'sha256' ||
      !/^0x[0-9a-f]{64}$/.test(ref.digest.value)
    )
      throw new Error('Invalid artifact reference');
    const asset = await load(ref.uri);
    if ((await sha256(asset)) !== ref.digest.value) throw new Error('Circuit artifact digest mismatch');
    results.set(ref.uri, asset);
  }
  const graph = JSON.parse(new TextDecoder().decode(results.get(d.origin.graph.uri)));
  validateGraph(graph);
  if (
    d.origin.dataset.source?.digest?.algorithm !== 'sha256' ||
    d.origin.dataset.source.digest.value !== graph.sources?.[1]?.sha256 ||
    d.origin.dataset.source.uri !== graph.sources?.[1]?.uri ||
    graph.extractionSha256 !== d.origin.extraction.digest.value ||
    d.origin.dataset.license !== graph.license ||
    d.origin.dataset.attribution !== graph.attribution
  )
    throw new Error('Source provenance mismatch');
  return { descriptor: d, descriptorHash, graph };
}
