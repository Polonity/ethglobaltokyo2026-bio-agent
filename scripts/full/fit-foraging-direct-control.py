"""Fit a non-neural control from the identical recorded collection actions/rewards."""
import argparse,json,sqlite3,hashlib
from pathlib import Path
import numpy as np
p=argparse.ArgumentParser();p.add_argument('database');p.add_argument('output');a=p.parse_args()
db=sqlite3.connect(f'file:{Path(a.database).resolve()}?mode=ro',uri=True)
result={'schema':'bioagent.foraging-direct-control.v1','scope':'Direct 16-channel sensory drives; same collected actions/rewards and ridge constants as the neural readout; no target-position steering rule.','agents':[]}
for agent in [0,1]:
 rows=db.execute("SELECT d.id,d.observation,d.action,o.reward FROM decisions d JOIN outcomes o ON d.id=o.decision_id WHERE d.app='foraging' AND d.variant='full' AND d.phase='collect' AND d.agent=? ORDER BY d.created,d.id",(agent,)).fetchall()
 x=np.array([json.loads(r[1])['drives'] for r in rows]);actions=np.array([r[2] for r in rows]);y=np.array([r[3] for r in rows]);split=int(len(x)*.7)
 mean=x[:split].mean(axis=0);scale=np.maximum(x[:split].std(axis=0),1e-3);features=np.column_stack([np.ones(len(x)),np.clip((x-mean)/scale,-20,20)])
 weights=np.zeros((9,features.shape[1]));counts=[]
 for action in range(9):
  mask=actions[:split]==action;counts.append(int(mask.sum()));assert mask.sum()>=3
  q=features[:split][mask];ridge=np.eye(q.shape[1])*.1;ridge[0,0]=.001
  weights[action]=np.linalg.solve(q.T@q+ridge,q.T@y[:split][mask])
 result['agents'].append({'mean':mean.tolist(),'scale':scale.tolist(),'weights':weights.tolist(),'collectionDecisions':[r[0] for r in rows],'trainingSamples':split,'predictionSelectionSamples':len(rows)-split,'actionSamples':counts})
Path(a.output).write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps({'control':a.output,'samples':[len(x['collectionDecisions']) for x in result['agents']]}))
