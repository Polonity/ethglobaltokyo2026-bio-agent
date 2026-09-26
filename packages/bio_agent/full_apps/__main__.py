"""JSON-lines local process API. Only the Node loopback application server owns this process."""
import json
import sys
from pathlib import Path

import numpy as np

from .brain import BrainPool, APPS
from .learning import ExperienceStore, ACTIONS
from packages.bio_agent.full.model import ROOT


def main():
    brain=BrainPool()
    path=ROOT/'.local/full-apps'
    path.mkdir(parents=True,exist_ok=True)
    store=ExperienceStore(path/'experience.sqlite3',brain.hash)
    generators={}
    def dispatch(data):
        op=data['op']
        if op=='describe': return {**brain.identity,'brainHash':brain.hash,'actions':ACTIONS}
        if op=='summary': return store.summary()
        if op=='reset':
            brain.reset(data['session'])
            for key in list(generators):
                if key[1]==data['session']: del generators[key]
            return {'reset':True}
        if op=='outcome':
            store.outcome(data['decisionId'],data['reward'],data.get('metrics',{}),data.get('source',{}))
            return {'saved':True}
        if op=='train': return store.train(data['app'],data['variant'],data['agent'])
        if op=='adopt': return store.adopt(data['candidateHash'],data['evaluation'])
        if op!='act': raise ValueError('Unknown operation')
        app,variant,session=data['app'],data['variant'],data['session']
        phase=data.get('phase','live')
        if app not in APPS or variant not in ('full','legacy') or phase not in ('collect','live','selection','test'):
            raise ValueError('Invalid application/mode')
        if not isinstance(session,str) or len(session)>150: raise ValueError('Invalid session')
        epsilon=data.get('epsilon',1. if phase=='collect' else 0.)
        if type(epsilon) not in (float,int) or not 0<=epsilon<=1: raise ValueError('Invalid exploration')
        allowed=data.get('allowed',[list(range(ACTIONS[app]))]*2)
        if len(allowed)!=2 or any(not row or any(type(a)is not int or not 0<=a<ACTIONS[app] for a in row) for row in allowed):
            raise ValueError('Invalid action mask')
        observations=data.get('observations',[{},{}])
        if len(observations)!=2: raise ValueError('Two observations required')
        key=(app,session,variant)
        if key not in generators: generators[key]=np.random.default_rng(data.get('seed',2026))
        rng=generators[key]
        neural=brain.infer(app,session,data['drives'],variant)
        decisions=[]
        for agent,features in enumerate(neural['features']):
            candidate=data.get('candidates',[None,None])[agent]
            if candidate and phase not in ('selection','test'): raise ValueError('Candidate requires evaluation phase')
            policy=store.policy(app,variant,agent,len(features),candidate)
            scores=store.scores(policy,features)
            action=int(rng.choice(allowed[agent]) if rng.random()<epsilon else max(allowed[agent],key=lambda a:scores[a]))
            identifier=store.decision(app,variant,agent,session,phase,features,action,policy['version'],observations[agent],data.get('source',{}))
            decisions.append({'id':identifier,'agent':agent,'action':action,'policyVersion':policy['version'],
                              'candidateHash':candidate,'scores':scores.tolist()})
        return {'neural':neural,'decisions':decisions}
    print(json.dumps({'ready':True,'brainHash':brain.hash}),flush=True)
    for line in sys.stdin:
        if len(line)>200000:
            print(json.dumps({'id':None,'error':'Request too large'}),flush=True)
            continue
        data={}
        try:
            data=json.loads(line)
            result=dispatch(data)
            print(json.dumps({'id':data['id'],'result':result},allow_nan=False),flush=True)
        except Exception as error:
            store.db.rollback()
            print(json.dumps({'id':data.get('id'),'error':str(error)}),flush=True)


if __name__=='__main__':
    main()
