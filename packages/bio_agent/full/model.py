"""Shared sparse graph, independent full-size states; no neuron pruning or cache lookup.
Measured topology does not provide a validated neuronal dynamics model.
"""
import hashlib
import json
import time
from pathlib import Path

import numpy as np
from scipy.sparse import load_npz

ROOT = Path(__file__).resolve().parents[3]
DEFAULT_GRAPH = ROOT / '.local/malecns-full'
MODEL = 'malecns-full-positive-rate-v1'


def sha(path):
    h = hashlib.sha256()
    with Path(path).open('rb') as f:
        for block in iter(lambda: f.read(8 * 1024 * 1024), b''):
            h.update(block)
    return '0x' + h.hexdigest()


class FullCircuit:
    def __init__(self, directory=DEFAULT_GRAPH, normalization='incoming', agents=3, kernel='per-agent'):
        start = time.perf_counter()
        directory = Path(directory)
        self.manifest = json.loads((directory / 'manifest.json').read_text())
        if self.manifest.get('schema') != 'bioagent.malecns-full-graph.v1':
            raise ValueError('Unsupported graph')
        for name in ['counts.npz', 'body-ids.npy', 'neurons.json']:
            if sha(directory / name) != self.manifest['artifacts'][name]:
                raise ValueError('Full graph artifact mismatch: ' + name)
        self.graph_hash = sha(directory / 'manifest.json')
        self.runtime_hash = sha(Path(__file__))
        self.ids = np.load(directory / 'body-ids.npy', allow_pickle=False)
        self.neurons = json.loads((directory / 'neurons.json').read_text())
        self.matrix = load_npz(directory / 'counts.npz')
        if (self.matrix.shape != (len(self.ids), len(self.ids)) or
                self.matrix.nnz != self.manifest['connections'] or
                len(self.ids) != self.manifest['neurons'] or
                not np.all(np.isfinite(self.matrix.data)) or np.any(self.matrix.data <= 0)):
            raise ValueError('Invalid full graph')
        if kernel not in ('per-agent', 'batched'):
            raise ValueError('Unknown sparse kernel')
        self.kernel = kernel
        self.normalization = normalization
        if normalization == 'incoming':
            self.divisor = np.maximum(1, np.asarray(self.matrix.sum(axis=1)).ravel())
        elif normalization == 'global-max':
            self.divisor = np.full(len(self.ids), self.matrix.data.max())
        else:
            raise ValueError('Unknown normalization')
        # Keep counts unchanged. Normalize drive at each step, not graph topology.
        self.groups = {name: np.array([i for i, n in enumerate(self.neurons)
                                      if n['superclass'] == name], dtype=np.int32)
                       for name in self.manifest['superclasses']}
        if not isinstance(agents, int) or not 1 <= agents <= 16:
            raise ValueError('Expected 1..16 agents')
        self.agents = agents
        self.activity = np.zeros((len(self.ids), agents), dtype=np.float64)
        self.tick = 0
        self.load_seconds = time.perf_counter() - start

    def indices(self, channel):
        if channel == 'DNp01':
            i = int(np.searchsorted(self.ids, 10001))
            if i >= len(self.ids) or self.ids[i] != 10001:
                raise ValueError('DNp01 body 10001 missing')
            return np.array([i])
        if channel in ('ol_sensory', 'cb_sensory', 'vnc_sensory'):
            return self.groups[channel]
        raise ValueError('Unknown input channel')

    def reset(self):
        self.activity.fill(0)
        self.tick = 0

    def advance(self, stimuli=(0.2, 0.5, 1.0), steps=32, channel='DNp01', ablated=False):
        values = np.asarray(stimuli, dtype=np.float64)
        if values.shape != (self.agents,) or not np.all(np.isfinite(values)) or np.any((values < 0) | (values > 1)):
            raise ValueError('One finite stimulus in [0,1] required per agent')
        if type(steps) is not int or not 1 <= steps <= 128 or type(ablated) is not bool:
            raise ValueError('Expected 1..128 steps and boolean ablated')
        inputs = self.indices(channel)
        start = time.perf_counter()
        for _ in range(steps):
            if ablated:
                drive = np.zeros_like(self.activity)
            elif self.kernel == 'per-agent':
                # SciPy CSR matvec is faster on this host than the narrow matmat
                # kernel. Every edge/count and every agent state is unchanged.
                drive = np.column_stack([self.matrix @ np.ascontiguousarray(self.activity[:, i])
                                         for i in range(self.agents)])
            else:
                drive = self.matrix @ self.activity
            drive /= self.divisor[:, None]
            drive[inputs, :] += values[None, :]
            self.activity *= 0.75
            self.activity += 0.25 * np.tanh(drive)
            self.tick += 1
        duration = time.perf_counter()-start
        if not np.all(np.isfinite(self.activity)):
            raise ValueError('Non-finite full graph state')
        motor = np.concatenate([self.groups['vnc_motor'], self.groups['cb_motor']])
        # Output is a descriptive statistic, NOT a validated motor decoder.
        return {
            'schema': 'bioagent.full-circuit-result.v1', 'model': MODEL,
            'graphHash': self.graph_hash, 'runtimeHash': self.runtime_hash, 'normalization': self.normalization,
            'neuronsPerAgent': len(self.ids), 'connections': self.matrix.nnz,
            'agents': self.agents, 'kernel': self.kernel, 'tick': self.tick, 'steps': steps,
            'channel': channel, 'inputNeurons': len(inputs), 'stimuli': values.tolist(),
            'ablated': ablated, 'seconds': duration, 'millisecondsPerStep': duration*1000/steps,
            'stateBytes': self.activity.nbytes,
            'activeAbove1e-12': (self.activity > 1e-12).sum(axis=0).tolist(),
            'meanActivity': self.activity.mean(axis=0).tolist(),
            'maxActivity': self.activity.max(axis=0).tolist(),
            'saturatedAbove0_95': (self.activity > .95).sum(axis=0).tolist(),
            'motorMean': self.activity[motor].mean(axis=0).tolist(),
            'groups': {name: self.activity[idx].mean(axis=0).tolist() for name, idx in self.groups.items()},
        }

    def save(self, path):
        np.savez(path, activity=self.activity, tick=np.array(self.tick),
                 graph_hash=np.array(self.graph_hash), runtime_hash=np.array(self.runtime_hash), model=np.array(MODEL),
                 normalization=np.array(self.normalization), kernel=np.array(self.kernel))

    def restore(self, path):
        with np.load(path, allow_pickle=False) as c:
            a = c['activity']
            tick = c['tick'].item()
            if (c['graph_hash'].item() != self.graph_hash or c['runtime_hash'].item() != self.runtime_hash or c['model'].item() != MODEL or
                    c['normalization'].item() != self.normalization or c['kernel'].item() != self.kernel or a.shape != self.activity.shape or
                    type(tick) is not int or tick < 0 or
                    not np.all(np.isfinite(a)) or np.any((a < 0) | (a > 1))):
                raise ValueError('Checkpoint does not match model/state')
            self.activity[:] = a
            self.tick = tick
