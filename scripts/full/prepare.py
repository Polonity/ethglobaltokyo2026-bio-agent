"""Prepare every classified MaleCNS v1.0 neuron, without region/top-k pruning.
Source confidence threshold (0.5) is upstream, not an additional filter.
Run from repository root: python scripts/full/prepare.py
"""
import argparse
import hashlib
import urllib.request
import json
import time
from collections import Counter
from pathlib import Path

import numpy as np
import pyarrow as pa
import pyarrow.feather as feather
from scipy.sparse import coo_matrix, save_npz

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / '.local/connectome-source'
OUT = ROOT / '.local/malecns-full'


def sha(path):
    h = hashlib.sha256()
    with path.open('rb') as f:
        for chunk in iter(lambda: f.read(8 * 1024 * 1024), b''):
            h.update(chunk)
    return '0x' + h.hexdigest()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--download', action='store_true', help='Download missing pinned source files')
    args = parser.parse_args()
    started = time.perf_counter()
    OUT.mkdir(parents=True, exist_ok=True)
    pin = json.loads((ROOT / 'packages/bio_agent/connectome/male-cns-slice.json').read_text())
    for name, source in zip(['annotations', 'weights'], pin['sources']):
        path = SOURCE / (name + '.feather')
        if not path.exists() and args.download:
            SOURCE.mkdir(parents=True, exist_ok=True)
            temporary = path.with_suffix('.download')
            print('Downloading', source['uri'], flush=True)
            urllib.request.urlretrieve(source['uri'], temporary)
            if sha(temporary) != source['sha256']:
                raise ValueError('Downloaded source hash mismatch: ' + name)
            temporary.replace(path)
        if sha(path) != source['sha256']:
            raise ValueError('Source hash mismatch: ' + name)
    rows = feather.read_table(SOURCE / 'annotations.feather',
        columns=['bodyId', 'type', 'superclass', 'somaSide', 'status']).to_pylist()
    # All 166,700 classified neurons: do not restrict status, region, type or strength.
    neurons = sorted((r for r in rows if r['superclass'] is not None), key=lambda r: r['bodyId'])
    ids = np.array([r['bodyId'] for r in neurons], dtype=np.int64)
    if len(ids) != 166700 or len(np.unique(ids)) != len(ids):
        raise ValueError('Pinned v1.0 neuron population changed')
    pres, posts, counts = [], [], []
    all_rows = kept_rows = all_weight = kept_weight = boundary_rows = boundary_weight = 0
    with pa.memory_map(str(SOURCE / 'weights.feather'), 'r') as f:
        reader = pa.ipc.open_file(f)
        for i in range(reader.num_record_batches):
            b = reader.get_batch(i)
            pre = b.column('body_pre').to_numpy()
            post = b.column('body_post').to_numpy()
            weight = b.column('weight').to_numpy()
            if np.any(weight <= 0):
                raise ValueError('Nonpositive source count')
            a, z = np.searchsorted(ids, pre), np.searchsorted(ids, post)
            ain = (a < len(ids)) & (ids[np.minimum(a, len(ids)-1)] == pre)
            zin = (z < len(ids)) & (ids[np.minimum(z, len(ids)-1)] == post)
            keep = ain & zin
            boundary = ain ^ zin
            pres.append(a[keep].astype(np.int32))
            posts.append(z[keep].astype(np.int32))
            counts.append(weight[keep].astype(np.float64))
            all_rows += len(weight)
            kept_rows += int(keep.sum())
            all_weight += int(weight.sum())
            kept_weight += int(weight[keep].sum())
            boundary_rows += int(boundary.sum())
            boundary_weight += int(weight[boundary].sum())
            if i % 300 == 0:
                print(f'Batch {i}/{reader.num_record_batches}: {kept_rows:,} connections retained', flush=True)
    # W[post, pre] @ activity: all retained counts remain exact float64 integers.
    matrix = coo_matrix((np.concatenate(counts), (np.concatenate(posts), np.concatenate(pres))),
                        shape=(len(ids), len(ids))).tocsr()
    matrix.sort_indices()
    if matrix.nnz != kept_rows or int(matrix.data.sum()) != kept_weight:
        raise ValueError('Duplicate pair or count loss during conversion')
    save_npz(OUT / 'counts.npz', matrix, compressed=False)
    np.save(OUT / 'body-ids.npy', ids)
    (OUT / 'neurons.json').write_text(json.dumps(neurons, separators=(',', ':')) + '\n')
    report = {
        'schema': 'bioagent.malecns-full-graph.v1', 'dataset': 'male-cns:v1.0',
        'license': pin['license'], 'attribution': pin['attribution'], 'sources': pin['sources'],
        'population': 'ALL annotation rows with non-null superclass; no type, region, status or degree filter',
        'neurons': len(ids), 'sourceAnnotationRows': len(rows),
        'excludedUnclassifiedAnnotationRows': len(rows)-len(ids),
        'connections': matrix.nnz, 'synapseCountSum': kept_weight,
        'sourceConnectionRows': all_rows, 'sourceSynapseCountSum': all_weight,
        'boundaryConnectionRows': boundary_rows, 'boundarySynapseCountSum': boundary_weight,
        'excludedConnectionRows': all_rows-kept_rows,
        'boundary': 'Unclassified segments/glia/fragments are not additional identified neurons. Connections with either endpoint outside the classified population are excluded and counted. This is not the entire segmentation graph.',
        'superclasses': dict(Counter(r['superclass'] for r in neurons)),
        'statusCounts': dict(Counter(str(r['status']) for r in neurons)),
        'csrBytes': matrix.data.nbytes + matrix.indices.nbytes + matrix.indptr.nbytes,
        'sourceMaxCountWithinPopulation': int(matrix.data.max()),
        'prepareSeconds': time.perf_counter()-started,
        'preparationSha256': sha(Path(__file__)),
        'artifacts': {name: sha(OUT / name) for name in ['counts.npz', 'body-ids.npy', 'neurons.json']},
    }
    (OUT / 'manifest.json').write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps({k: report[k] for k in ['neurons', 'connections', 'synapseCountSum', 'csrBytes', 'prepareSeconds']}, indent=2))


if __name__ == '__main__':
    main()
