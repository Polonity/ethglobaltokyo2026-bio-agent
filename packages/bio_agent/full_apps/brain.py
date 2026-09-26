"""Stateful full MaleCNS and the previous seven-neuron encoder as explicit alternatives.
The full population is never replaced by cached scalar trial results.
"""
import copy
import hashlib
import json
import time
from pathlib import Path

import numpy as np

from packages.bio_agent.full.model import FullCircuit, ROOT, sha

INPUTS = 16
APPS = ('foraging', 'market', 'aqua')


def digest(value):
    return '0x' + hashlib.sha256(json.dumps(value, sort_keys=True, separators=(',', ':')).encode()).hexdigest()


class BrainPool:
    def __init__(self, base=None):
        self.base = base or FullCircuit(agents=2)
        self.sessions = {}
        self.population = sorted(self.base.groups)
        # Engineering multiplexing, declared rather than attributed to physiology.
        sensory = np.sort(np.concatenate([self.base.groups.get(k, np.array([], dtype=np.int32))
                           for k in ('ol_sensory', 'cb_sensory', 'vnc_sensory')]))
        motor = np.sort(np.concatenate([self.base.groups[k] for k in ('cb_motor','vnc_motor')]))
        self.inputs = [sensory[i::INPUTS] for i in range(INPUTS)]
        self.outputs = [motor[i::INPUTS] for i in range(INPUTS)]
        self.legacy = json.loads((ROOT/'packages/bio_agent/connectome/male-cns-slice.json').read_text())
        index = {n['id']:i for i,n in enumerate(self.legacy['nodes'])}
        self.small = np.zeros((7,7))
        for e in self.legacy['edges']:
            self.small[index[e['post']],index[e['pre']]] = e['count']
        self.small /= self.small.max()
        self.small_input = index[self.legacy['inputNode']]
        self.small_outputs = [index[n] for n in self.legacy['readoutNodes']]
        self.identity = {
            'schema':'bioagent.app-brain.v1','dataset':'male-cns:v1.0',
            'fullGraph':self.base.graph_hash,'fullRuntime':self.base.runtime_hash,
            'encoder':sha(Path(__file__)), 'inputs':INPUTS,
            'applicationAdapters':{app:sha(ROOT/f'services/full-apps/{app}.mjs') for app in APPS},
            'full':{'neurons':len(self.base.ids),'connections':self.base.matrix.nnz,
                    'normalization':self.base.normalization,'stepsPerDecision':4,
                    'state':'persistent per application/session/individual',
                    'inputMapping':'all sensory neurons sorted by body ID; round-robin across 16 drives',
                    'readout':'16 input-population means + 16 motor-population means + every superclass mean'},
            'legacy':{'neurons':7,'connections':19,'stepsPerDecision':32,
                      'state':'zero-state trial per input channel as in previous browser encoder',
                      'graph':sha(ROOT/'packages/bio_agent/connectome/male-cns-slice.json')},
            'limitations':['Positive artificial rate dynamics; not validated neurophysiology.',
                           'Legacy/full comparison includes encoding and temporal-state differences, not just neuron count.']}
        self.hash = digest(self.identity)

    def reset(self, session):
        for key in list(self.sessions):
            if key[1] == session: del self.sessions[key]

    def infer(self, app, session, drives, variant='full'):
        if app not in APPS or variant not in ('full','legacy'):
            raise ValueError('Unknown application or variant')
        x = np.asarray(drives, dtype=np.float64)
        if x.shape != (2,INPUTS) or not np.isfinite(x).all() or np.any((x<0)|(x>1)):
            raise ValueError('Expected two individuals, each with 16 drives in [0,1]')
        key=(app,session,variant)
        started=time.perf_counter()
        if variant == 'full':
            if key not in self.sessions:
                brain=copy.copy(self.base)
                brain.activity=np.zeros((len(brain.ids),2),dtype=np.float64)
                brain.tick=0
                self.sessions[key]=brain
            brain=self.sessions[key]
            for _ in range(4):
                drive=np.column_stack([brain.matrix@np.ascontiguousarray(brain.activity[:,i]) for i in range(2)])
                drive/=brain.divisor[:,None]
                for channel,idx in enumerate(self.inputs):
                    drive[idx]+=x[:,channel]
                brain.activity=.75*brain.activity+.25*np.tanh(drive)
                brain.tick+=1
            means=lambda idx: brain.activity[idx].mean(axis=0) if len(idx) else np.zeros(2)
            features=np.stack([means(idx) for idx in self.inputs+self.outputs+
                               [brain.groups[k] for k in self.population]],axis=1)
            state_tick=brain.tick
            active=(brain.activity>1e-12).sum(axis=0).tolist()
        else:
            # Exactly the previous 1/256 input grid and 32-step zero-state scalar trials.
            quantized=np.floor(x*256+.5)/256
            a=np.zeros((2,INPUTS,7))
            for _ in range(32):
                drive=a@self.small.T
                drive[:,:,self.small_input]+=quantized
                a=.75*a+.25*np.tanh(drive)
            signals=a[:,:,self.small_outputs].mean(axis=2)
            # Keep feature width identical; absence of full-population readouts is explicit.
            features=np.concatenate([signals/0.151,signals,np.zeros((2,len(self.population)))],axis=1)
            state_tick=32
            active=(a>1e-12).sum(axis=(1,2)).tolist()
        if not np.isfinite(features).all():
            raise ValueError('Non-finite neural features')
        return {'brainHash':self.hash,'variant':variant,'app':app,'session':session,
                'neuronsPerIndividual':self.identity[variant]['neurons'],
                'connections':self.identity[variant]['connections'], 'tick':state_tick,
                'features':features.tolist(),'activeAbove1e-12':active,
                'inferenceMs':(time.perf_counter()-started)*1000}
