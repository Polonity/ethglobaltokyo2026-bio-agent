"""Measure individual count and sparse kernel without changing any neural connections."""
import json
import platform
import sys
from pathlib import Path

import numpy as np

ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT))
from packages.bio_agent.full.model import FullCircuit

model=FullCircuit()
results=[]
for agents in [1,2,3]:
    reference=None
    for kernel in ['batched','per-agent']:
        model.agents=agents
        model.kernel=kernel
        model.activity=np.zeros((len(model.ids),agents),dtype=np.float64)
        model.tick=0
        model.advance([.5]*agents,steps=8,channel='cb_sensory')
        timings=[model.advance([.5]*agents,steps=16,channel='cb_sensory')['millisecondsPerStep'] for _ in range(3)]
        if reference is None: reference=model.activity.copy()
        error=float(np.abs(reference-model.activity).max())
        assert error<1e-12
        result={'agents':agents,'kernel':kernel,'millisecondsPerStep':timings,
                'medianStepsPerSecond':1000/float(np.median(timings)),
                'maxAbsErrorVersusBatched':error}
        results.append(result)
        print(json.dumps(result),flush=True)
report={'schema':'bioagent.full-scaling.v1','graphHash':model.graph_hash,'runtimeHash':model.runtime_hash,
        'neuronsPerAgent':len(model.ids),'connections':model.matrix.nnz,'precision':'float64',
        'platform':platform.platform(),'results':results,
        'interpretation':'Numerical steps per second, excluding HTTP/report/render overhead. Not biological time or display fps.'}
out=ROOT/'artifacts/malecns-full'
out.mkdir(parents=True,exist_ok=True)
(out/'agent-scaling.json').write_text(json.dumps(report,indent=2)+'\n')
