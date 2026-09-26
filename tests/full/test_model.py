import json
import tempfile
import unittest
from pathlib import Path

import numpy as np
from scipy.sparse import csr_matrix, save_npz

from packages.bio_agent.full.model import FullCircuit, sha


class FullRuntimeTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        # Includes a self-loop and converging inputs to detect orientation/scaling errors.
        self.counts = np.array([[0., 0., 0.], [4., 1., 0.], [2., 3., 0.]])
        save_npz(self.root/'counts.npz', csr_matrix(self.counts))
        np.save(self.root/'body-ids.npy', np.array([10001, 20001, 30001]))
        neurons = [{'bodyId':10001,'superclass':'ol_sensory'},
                   {'bodyId':20001,'superclass':'vnc_motor'},
                   {'bodyId':30001,'superclass':'cb_motor'}]
        (self.root/'neurons.json').write_text(json.dumps(neurons))
        manifest = {'schema':'bioagent.malecns-full-graph.v1','neurons':3,'connections':4,
                    'superclasses':{'ol_sensory':1,'vnc_motor':1,'cb_motor':1},
                    'artifacts':{name:sha(self.root/name) for name in ['counts.npz','body-ids.npy','neurons.json']}}
        (self.root/'manifest.json').write_text(json.dumps(manifest))
        self.model = FullCircuit(self.root)

    def tearDown(self):
        self.tmp.cleanup()

    def test_independent_scalar_and_agent_isolation(self):
        import math
        result = self.model.advance([0,.4,1], steps=17)
        expected = [[0.,0.,0.] for _ in range(3)]
        for _ in range(17):
            nxt = [[0.,0.,0.] for _ in range(3)]
            for post in range(3):
                divisor = max(1,sum(self.counts[post]))
                for agent in range(3):
                    drive = sum(self.counts[post,pre]*expected[pre][agent] for pre in range(3))/divisor
                    if post == 0: drive += [0,.4,1][agent]
                    nxt[post][agent] = .75*expected[post][agent] + .25*math.tanh(drive)
            expected = nxt
        np.testing.assert_allclose(self.model.activity, expected, atol=1e-14, rtol=0)
        self.assertTrue(np.all(self.model.activity[:,0] == 0))
        self.assertLess(result['motorMean'][1], result['motorMean'][2])

    def test_sparse_kernels_match_for_two_agents(self):
        a = FullCircuit(self.root, agents=2, kernel='per-agent')
        b = FullCircuit(self.root, agents=2, kernel='batched')
        a.advance([.3,.8], steps=32)
        b.advance([.3,.8], steps=32)
        np.testing.assert_allclose(a.activity, b.activity, atol=1e-14, rtol=0)

    def test_checkpoint_replay_and_rejection(self):
        self.model.advance(steps=8)
        path = self.root/'checkpoint.npz'
        self.model.save(path)
        self.model.advance(steps=3)
        expected = self.model.activity.copy()
        self.model.restore(path)
        self.model.advance(steps=3)
        np.testing.assert_array_equal(expected, self.model.activity)
        other = FullCircuit(self.root, normalization='global-max')
        with self.assertRaises(ValueError): other.restore(path)

    def test_ablated_and_zero(self):
        result = self.model.advance(ablated=True)
        self.assertEqual(result['motorMean'], [0,0,0])
        self.model.reset()
        self.model.advance([0,0,0])
        self.assertFalse(self.model.activity.any())

    def test_invalid_input_is_rejected_without_advancing(self):
        for kwargs in [{'steps':0},{'steps':129},{'steps':True},{'stimuli':[.5]},
                       {'stimuli':[0,float('nan'),1]},{'channel':'missing'},{'ablated':1}]:
            with self.assertRaises((ValueError,TypeError)): self.model.advance(**kwargs)
            self.assertEqual(self.model.tick,0)

    def test_tampered_artifact_stops_loading(self):
        with (self.root/'body-ids.npy').open('ab') as f: f.write(b'changed')
        with self.assertRaisesRegex(ValueError,'mismatch'): FullCircuit(self.root)


if __name__ == '__main__':
    unittest.main()
