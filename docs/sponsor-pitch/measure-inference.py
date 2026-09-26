"""Isolated CPU timing; no service calls, learning, chain activity or trade execution."""
import sys
import json
import hashlib
import platform
import resource
import time
import statistics
from datetime import datetime, timezone
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT))
import numpy as np
from packages.bio_agent.full_apps.brain import BrainPool
start=time.perf_counter()
brain=BrainPool()
load_seconds=time.perf_counter()-start
rng=np.random.default_rng(260926)
inputs=rng.uniform(.05,.95,size=(33,2,16))
records=[]
for i,x in enumerate(inputs):
 result=brain.infer('market','isolated-pitch-cost-check',x)
 if i>=3: records.append(result['inferenceMs'])
csr=brain.base.matrix
cpu=next((x.split(':',1)[1].strip() for x in Path('/proc/cpuinfo').read_text().splitlines() if x.startswith('model name')),'unknown')
paths=['packages/bio_agent/full_apps/brain.py','packages/bio_agent/full_apps/learning.py','packages/bio_agent/full/model.py']
report={
 'measuredAt':datetime.now(timezone.utc).isoformat(),
 'scope':'Isolated neural inference only; synthetic bounded inputs; no learning or swaps',
 'hardware':{'cpu':cpu,'platform':platform.platform(),'python':platform.python_version(),'backend':'NumPy/SciPy CPU; no GPU or LLM API calls'},
 'configuration':{'neuronsPerAgent':len(brain.base.ids),'directedConnections':csr.nnz,'agentsPerCall':2,'stepsPerAgentPerCall':4,'inputChannels':16,'warmupCalls':3,'measuredCalls':len(records),'seed':260926},
 'latencyMsPerJointCall':{'median':statistics.median(records),'p95':float(np.percentile(records,95)),'mean':statistics.mean(records),'min':min(records),'max':max(records)},
 'memory':{'processPeakRSSMiB':resource.getrusage(resource.RUSAGE_SELF).ru_maxrss/1024,'csrMatrixBytes':csr.data.nbytes+csr.indices.nbytes+csr.indptr.nbytes},
 'loadSeconds':load_seconds,
 'samplesMs':records,
 'sourceSha256':{s:hashlib.sha256((ROOT/s).read_bytes()).hexdigest() for s in paths},
 'notMeasured':['LLM baseline','small-AI baseline','device power','electricity cost','embedded hardware','end-to-end application latency','learning adaptation advantage','action quality parity'],
 'interpretation':'Timing supports CPU feasibility on this desktop host, not comparative energy, hardware-cost, or task-performance superiority.'
}
output=ROOT/'artifacts/sponsor-pitches-1min-20260926/uniswap/cost-evidence.json'
output.write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({k:v for k,v in report.items() if k not in ('samplesMs','sourceSha256')},ensure_ascii=False,indent=2))
