"""Four independent MaleCNS states and an explicitly engineered, online reward readout.
Weights update from confirmed outcomes; this is experimental adaptation, not a validated trading policy.
The original brain/runtime and old application policies remain unchanged.
"""
import json, os, sys, time, resource, hashlib
from pathlib import Path
import numpy as np
from .brain import BrainPool, digest


def main():
    brain=BrainPool()
    path=Path(os.environ.get('FULL_APPS_STATE_DIR','.local/shared-market'))
    path.mkdir(parents=True,exist_ok=True)
    identity=digest({'brain':brain.hash,'adapter':hashlib.sha256(Path(__file__).read_bytes()).hexdigest()})
    saved=path/'readout.json'
    state=json.loads(saved.read_text()) if saved.exists() else {'identity':identity,'weights':{},'updates':[0]*4}
    if state['identity']!=identity: raise ValueError('Readout adapter changed; use a new state directory')
    pending={}
    rng=np.random.default_rng(2026)
    def dispatch(d):
        if d['op']=='describe': return {**brain.identity,'brainHash':brain.hash,'adapterHash':identity}
        if d['op']=='outcome':
            item=pending.pop(d['decisionId'])
            i,x,action,pred=item
            reward=float(d['reward'])
            if not np.isfinite(reward): raise ValueError('Nonfinite reward')
            w=np.array(state['weights'][str(i)])
            # Bounded normalized SGD; fixed connectome, only economic action readout changes.
            w[action]+=0.03*(np.clip(reward,-1,1)-pred)*x/(1+np.dot(x,x))
            state['weights'][str(i)]=np.clip(w,-.3,.3).tolist()
            state['updates'][i]+=1
            tmp=saved.with_suffix('.tmp'); tmp.write_text(json.dumps(state)); tmp.replace(saved)
            with (path/'outcomes.jsonl').open('a') as f:
                f.write(json.dumps({'decisionId':d['decisionId'],'reward':reward,'source':d.get('source'), 'updates':state['updates'][i]})+'\n')
            return {'updates':state['updates'][i]}
        if d['op']!='infer': raise ValueError('Unknown operation')
        pair=d['pair']; app='aqua' if pair==0 else 'market'
        neural=brain.infer(app,'shared-market',d['drives'],'full')
        decisions=[]
        for j,features in enumerate(neural['features']):
            i=pair*2+j; f=np.array(features); x=np.r_[1.,f]
            w=np.array(state['weights'].setdefault(str(i),np.zeros((3,len(x))).tolist()))
            learned=w@x
            # Drives 0/1 encode buy/sell deficit for traders, risk/inventory for makers.
            base=np.array([.06,f[0],f[1]]) if pair else np.array([.12-f[0],f[0],f[1]-.1])
            scores=base+learned
            allowed=d.get('allowed',[[0,1,2],[0,1,2]])[j]
            explore=bool(rng.random()<.12)
            action=int(rng.choice(allowed) if explore else max(allowed,key=lambda a:scores[a]))
            decisionId=f'{time.time_ns()}-{i}'
            pending[decisionId]=(i,x,action,float(learned[action]))
            decision={'id':decisionId,'individual':i,'action':action,'scores':scores.tolist(),'exploration':explore,
                      'updates':state['updates'][i],'policyHash':digest({'adapter':identity,'individual':i,'weights':w.tolist()})}
            with (path/'decisions.jsonl').open('a') as out:
                out.write(json.dumps({**decision,'features':features,'drives':d['drives'][j],'source':d.get('source')})+'\n')
            decisions.append(decision)
        return {'decisions':decisions,'neural':{k:v for k,v in neural.items() if k!='features'},
                'processPeakRSSMiB':resource.getrusage(resource.RUSAGE_SELF).ru_maxrss/1024}
    print(json.dumps({'ready':True,'brainHash':brain.hash}),flush=True)
    for line in sys.stdin:
        d={}
        try:
            d=json.loads(line); result=dispatch(d)
            print(json.dumps({'id':d['id'],'result':result},allow_nan=False),flush=True)
        except Exception as e: print(json.dumps({'id':d.get('id'),'error':str(e)}),flush=True)

if __name__=='__main__': main()
