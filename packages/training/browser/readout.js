import { MALE_CNS } from '../../bio_agent/connectome/male-cns.js';
export function exportReadout(fly, useCase) {
  return {
    schema: 'bioagent.readout.v1',
    useCase,
    model: MALE_CNS.graphSha256,
    agentId: fly.id,
    version: fly.version,
    q: structuredClone(fly.q),
    report: structuredClone(fly.lastReport || fly.report || null),
  };
}
export function restoreReadout(fly, artifact, useCase) {
  const size = useCase === 'foraging' ? 9 : useCase === 'market' ? 3 : 0;
  if (
    !size ||
    artifact?.schema !== 'bioagent.readout.v1' ||
    artifact.useCase !== useCase ||
    artifact.model !== MALE_CNS.graphSha256 ||
    artifact.agentId !== fly.id ||
    !Number.isSafeInteger(artifact.version) ||
    artifact.version < 1 ||
    !artifact.q ||
    typeof artifact.q !== 'object' ||
    Array.isArray(artifact.q) ||
    Object.keys(artifact.q).length > 50000
  )
    throw Error('Incompatible MaleCNS readout');
  for (const [key, row] of Object.entries(artifact.q)) {
    if (
      !/^[0-9,:.-]+$/.test(key) ||
      !Array.isArray(row) ||
      row.length !== size ||
      row.some((x) => !Number.isFinite(x))
    )
      throw Error('Malformed readout');
  }
  fly.q = structuredClone(artifact.q);
  fly.version = artifact.version;
  if (useCase === 'foraging') fly.lastReport = structuredClone(artifact.report);
  else fly.report = structuredClone(artifact.report);
  return true;
}
// Scoped by deployment+base model. Storage is optional; no model fallback on failure.
export function policyStorage(storage, scope, useCase) {
  const saved = new Map();
  return {
    restore(fly) {
      try {
        const raw = storage.getItem(`${scope}:${fly.id}`);
        if (raw) restoreReadout(fly, JSON.parse(raw), useCase);
        saved.set(fly.id, fly.version);
        return true;
      } catch {
        return false;
      }
    },
    save(fly) {
      if (saved.get(fly.id) === fly.version) return true;
      try {
        storage.setItem(`${scope}:${fly.id}`, JSON.stringify(exportReadout(fly, useCase)));
        saved.set(fly.id, fly.version);
        return true;
      } catch {
        return false;
      }
    },
  };
}
