import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  ConnectomeCircuit,
  runCircuitTrial,
  loadCircuitBundle,
} from '../packages/bio_agent/connectome/circuit.js';
const graph = JSON.parse(await readFile('packages/bio_agent/connectome/male-cns-slice.json', 'utf8'));
test('measured connections affect actual decisions; ablation leaves directly driven neuron only', () => {
  const zero = runCircuitTrial(graph, 0),
    weak = runCircuitTrial(graph, 0.1),
    strong = runCircuitTrial(graph, 1);
  const control = runCircuitTrial(graph, 1, 32, true);
  assert.equal(zero.final.response, 0);
  assert.ok(strong.final.response > weak.final.response);
  assert.equal(strong.final.action, 'advance');
  assert.equal(control.final.action, 'wait');
  assert.equal(control.final.response, 0);
  assert.ok(control.final.activity[0] > 0);
});
test('checkpoint resumes exactly and rejects another graph or invalid state atomically', () => {
  const a = new ConnectomeCircuit(graph);
  for (let i = 0; i < 13; i++) a.step(0.7);
  const b = new ConnectomeCircuit(graph);
  b.restore(JSON.parse(JSON.stringify(a.checkpoint())));
  for (let i = 0; i < 30; i++) assert.deepEqual(a.step(0.3), b.step(0.3));
  const before = b.checkpoint();
  for (const bad of [
    { ...before, graph: 'changed' },
    { ...before, activity: [NaN] },
    { ...before, tick: -1 },
  ]) {
    assert.throws(() => b.restore(bad));
    assert.deepEqual(b.checkpoint(), before);
  }
  for (const input of [-1, 2, NaN, Infinity]) assert.throws(() => b.step(input));
});
test('reject ambiguous neuron IDs, missing readouts, invalid or duplicate edges', () => {
  const bad = structuredClone(graph);
  bad.nodes[1].id = bad.nodes[0].id;
  assert.throws(() => new ConnectomeCircuit(bad));
  assert.throws(() => new ConnectomeCircuit({ ...graph, readoutNodes: [graph.inputNode] }));
  assert.throws(() => new ConnectomeCircuit({ ...graph, edges: [...graph.edges, graph.edges[0]] }));
  assert.throws(
    () => new ConnectomeCircuit({ ...graph, edges: [{ pre: graph.inputNode, post: '999999', count: 1 }] }),
  );
});
const localFetch = async (url) => new Response(await readFile('dist' + url));
test('registered descriptor verifies every local artifact; corruption fails closed', async () => {
  const good = await loadCircuitBundle(localFetch);
  assert.equal(good.descriptor.origin.kind, 'connectome-derived');
  assert.equal(good.graph.nodes.length, 7);
  assert.equal(good.graph.edges.length, 19);
  await assert.rejects(loadCircuitBundle(localFetch, '0x' + '00'.repeat(32)), /descriptor mismatch/);
  await assert.rejects(
    loadCircuitBundle(async (url) => {
      if (url.endsWith('graph.json')) return new Response('{}');
      return localFetch(url);
    }),
    /digest mismatch/,
  );
  await assert.rejects(
    loadCircuitBundle(async (url) => {
      if (url.endsWith('descriptor.json')) {
        const d = structuredClone(good.descriptor);
        d.origin.dataset.source.digest.value = '0x' + '00'.repeat(32);
        return new Response(JSON.stringify(d));
      }
      return localFetch(url);
    }),
    /provenance mismatch/,
  );
});
