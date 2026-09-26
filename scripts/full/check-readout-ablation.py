"""Held policies and inputs, zeroed connections: graph-dependence diagnostic, not physiology."""
import json
import os
os.environ['OPENBLAS_NUM_THREADS']='1'
import numpy as np
from scipy.sparse import csr_matrix
from packages.bio_agent.full_apps.brain import BrainPool,APPS
from packages.bio_agent.full_apps.learning import ExperienceStore
from packages.bio_agent.full.model import ROOT
brain=BrainPool();store=ExperienceStore(ROOT/'.local/full-apps/experience.sqlite3',brain.hash)
measured=brain.base.matrix;empty=csr_matrix(measured.shape,dtype=measured.dtype)
rng=np.random.default_rng(93481);result={'brainHash':brain.hash,'inputSeed':93481,'cases':[]}
for app in APPS:
    changed=[0,0];feature_delta=0.;score_delta=0.
    for tick in range(32):
        drives=rng.random((2,16));brain.base.matrix=measured
        regular=brain.infer(app,app+'-measured',drives)
        brain.base.matrix=empty
        ablated=brain.infer(app,app+'-ablated',drives)
        for agent in (0,1):
            x=regular['features'][agent];z=ablated['features'][agent]
            policy=store.policy(app,'full',agent,len(x));a=store.scores(policy,x);b=store.scores(policy,z)
            changed[agent]+=int(np.argmax(a)!=np.argmax(b))
            feature_delta=max(feature_delta,float(np.max(np.abs(np.array(x)-z))))
            score_delta=max(score_delta,float(np.max(np.abs(a-b))))
    result['cases'].append({'app':app,'samplesPerIndividual':32,'changedArgmax':changed,'maxFeatureDelta':feature_delta,'maxScoreDelta':score_delta,
        'limitation':'Unmasked action argmax on artificial input probes, not application performance.'})
    brain.reset(app+'-measured');brain.reset(app+'-ablated')
brain.base.matrix=measured
(ROOT/'artifacts/full-apps/readout-ablation.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(result))
