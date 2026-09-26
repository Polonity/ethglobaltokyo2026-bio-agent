import sqlite3,json,math,collections
from pathlib import Path
root=Path(__file__).resolve().parents[2]
e=json.loads((root/'docs/submission/presenter-kit/capture-evidence.json').read_text())
db=sqlite3.connect(f'file:{root}/.local/presenter-current-foraging/experience.sqlite3?mode=ro',uri=True)
def summarize(ids):
 rows=[]
 for ident in ids:
  row=db.execute('SELECT d.action,d.observation,o.metrics,o.reward,d.policy_version FROM decisions d JOIN outcomes o ON o.decision_id=d.id WHERE d.id=?',(ident,)).fetchone()
  if row:rows.append(row)
 actions=collections.Counter();toward=away=move=collected=hit=0;gain=0
 for action,obs,metrics,reward,version in rows:
  obs=json.loads(obs);m=json.loads(metrics);actions[action]+=1;collected+=m['collected'];hit+=m['hit']
  if obs.get('target') and action<8:
   t=obs['target']; delta=math.hypot(obs['x']-t['x'],obs['y']-t['y'])-math.hypot(m['x']-t['x'],m['y']-t['y']);gain+=delta;move+=1;toward+=delta>1e-8;away+=delta< -1e-8
 return {'steps':len(rows),'actions':dict(actions),'moveWithTarget':move,'toward':toward,'away':away,'distanceGain':gain,'collected':collected,'hazardSteps':hit,'reward':sum(r[3] for r in rows),'policyVersions':sorted(set(r[4] for r in rows))}
r={'scope':'Read-only diagnosis of the submitted recording, not a new experiment', 'captureRecordedAt':e['recordedAt'], 'behaviorAcceptanceMet':False, 'definition':'Toward/away compares distance to the target observed before each moving action; stationary/clamped movement can be neither.', 'stages':{}}
for phase in ['collection','before','after','test']:
 r['stages'][phase]=[summarize(ids) for ids in e['foraging']['report'][phase]['ids']]
# First shown live session: recover the session from its recorded decision IDs.
r['openingLive']=[]
for d in e['foraging']['first']['decisions']:
 session=db.execute('SELECT session,agent FROM decisions WHERE id=?',(d['id'],)).fetchone()
 ids=[x[0] for x in db.execute('SELECT id FROM decisions WHERE session=? AND agent=? ORDER BY created',session)]
 r['openingLive'].append(summarize(ids))
(root/'docs/submission/presenter-kit/foraging-behavior-review.json').write_text(json.dumps(r,indent=2)+'\n')
print(json.dumps({'behaviorAcceptanceMet':False,'test':r['stages']['test']},ensure_ascii=False))
