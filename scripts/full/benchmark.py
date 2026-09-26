"""Actual whole-population trials, matched small-slice controls and checkpoint replay."""
import json
import platform
import resource
import sys
import time
from pathlib import Path

import numpy as np
from scipy.sparse import csr_matrix

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))
from packages.bio_agent.full.model import FullCircuit, MODEL


def main():
    out = ROOT / 'artifacts/malecns-full'
    out.mkdir(parents=True, exist_ok=True)
    model = FullCircuit()
    cases = []
    for channel in ['DNp01', 'ol_sensory', 'cb_sensory', 'vnc_sensory']:
        model.reset()
        result = model.advance(channel=channel)
        cases.append(result)
        print(json.dumps({k: result[k] for k in ['channel','neuronsPerAgent','connections','seconds','activeAbove1e-12','motorMean']}), flush=True)
    model.save(out / 'checkpoint.npz')
    model.advance(steps=2)
    expected = model.activity.copy()
    model.restore(out / 'checkpoint.npz')
    model.advance(steps=2)
    checkpoint_error = float(np.abs(model.activity-expected).max())
    assert checkpoint_error == 0
    model.reset()
    ablated = model.advance(channel='ol_sensory', ablated=True)
    assert all(x == 0 for x in ablated['motorMean'])
    model.reset()
    zero = model.advance(stimuli=[0,0,0])
    assert not model.activity.any()
    # Full-vs-7 uses the SAME recurrence, inputs and six readout IDs. The
    # shared divisor isolates omitted edges from a normalization change.
    small = json.loads((ROOT / 'packages/bio_agent/connectome/male-cns-slice.json').read_text())
    idx = np.searchsorted(model.ids, [int(n['id']) for n in small['nodes']])
    indices = {n['id']: i for i,n in enumerate(small['nodes'])}
    matrix = csr_matrix(([e['count'] for e in small['edges']],
                         ([indices[e['post']] for e in small['edges']],
                          [indices[e['pre']] for e in small['edges']])), shape=(7,7), dtype=np.float64)
    assert np.array_equal(model.matrix[idx][:,idx].toarray(), matrix.toarray())
    readout = [indices[n] for n in small['readoutNodes']]
    comparisons = []
    for normalization in ['incoming', 'global-max']:
        model.normalization = normalization
        model.divisor = (np.maximum(1, np.asarray(model.matrix.sum(axis=1)).ravel()) if normalization == 'incoming'
                         else np.full(len(model.ids), model.matrix.data.max()))
        model.reset()
        result = model.advance()
        small_a = np.zeros((7,3))
        start = time.perf_counter()
        for _ in range(32):
            drive = (matrix @ small_a) / model.divisor[idx,None]
            drive[indices[small['inputNode']]] += [.2,.5,1]
            small_a = .75*small_a + .25*np.tanh(drive)
        comparisons.append({'normalization': normalization, 'fullSeconds': result['seconds'],
                            'sliceSeconds': time.perf_counter()-start,
                            'sameSixReadoutsFull': model.activity[idx[readout]].mean(axis=0).tolist(),
                            'sameSixReadoutsSlice': small_a[readout].mean(axis=0).tolist(),
                            'sixReadoutMaxAbsError': float(np.abs(model.activity[idx[readout]]-small_a[readout]).max()),
                            'fullActive': result['activeAbove1e-12'],
                            'fullSaturated': result['saturatedAbove0_95']})
    report = {'schema':'bioagent.full-scale-benchmark.v1', 'model':MODEL,
              'platform':platform.platform(), 'python':platform.python_version(),
              'loadSeconds':model.load_seconds, 'graph':model.manifest, 'cases':cases,
              'ablated':ablated, 'zero':zero, 'checkpointReplayMaxError':checkpoint_error,
              'smallSliceCountsMatchSource':True, 'comparisons':comparisons,
              'processPeakRssMiB':resource.getrusage(resource.RUSAGE_SELF).ru_maxrss/1024,
              'limitations':['Artificial all-positive rate dynamics and inputs; not validated fly behavior.',
                            'All classified neurons, excluding unclassified segments and their boundary edges.',
                            'Wall time on this host; not biological time, GPU performance or application throughput.',
                            'Comparison measures response differences, not behavioral importance or learning superiority.']}
    (out / 'benchmark.json').write_text(json.dumps(report,indent=2)+'\n')
    print('Saved',out/'benchmark.json', flush=True)


if __name__ == '__main__':
    main()
