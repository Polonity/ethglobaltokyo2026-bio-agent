"""Reward readouts trained only on recorded actions and their observed outcomes.
No synthetic target curve, no full-graph recomputation during regression.
"""
import json
import sqlite3
import time
import uuid

import numpy as np

from .brain import digest, APPS
from .readout import fit_tree, predict_tree
from packages.bio_agent.full.model import sha
from pathlib import Path

ACTIONS={'foraging':9,'market':3,'aqua':3}


class ExperienceStore:
    def __init__(self, path, brain_hash):
        self.db=sqlite3.connect(path)
        self.db.execute('PRAGMA foreign_keys=ON')
        self.brain_hash=brain_hash
        self.db.executescript('''
        CREATE TABLE IF NOT EXISTS decisions(
          id TEXT PRIMARY KEY, app TEXT NOT NULL, variant TEXT NOT NULL, agent INTEGER NOT NULL,
          brain_hash TEXT NOT NULL, session TEXT NOT NULL, phase TEXT NOT NULL,
          features TEXT NOT NULL, action INTEGER NOT NULL, policy_version INTEGER NOT NULL,
          observation TEXT NOT NULL, source TEXT NOT NULL, created REAL NOT NULL);
        CREATE TABLE IF NOT EXISTS outcomes(
          decision_id TEXT PRIMARY KEY REFERENCES decisions(id), reward REAL NOT NULL,
          metrics TEXT NOT NULL, source TEXT NOT NULL, created REAL NOT NULL);
        CREATE TABLE IF NOT EXISTS policies(
          hash TEXT PRIMARY KEY, app TEXT NOT NULL, variant TEXT NOT NULL, agent INTEGER NOT NULL,
          brain_hash TEXT NOT NULL, version INTEGER NOT NULL, artifact TEXT NOT NULL,
          adopted INTEGER NOT NULL DEFAULT 0, created REAL NOT NULL);
        CREATE TABLE IF NOT EXISTS learning_runs(
          id TEXT PRIMARY KEY, artifact TEXT NOT NULL, created REAL NOT NULL);
        ''')

    def policy(self, app, variant, agent, width, candidate=None):
        if candidate:
            row=self.db.execute('SELECT artifact FROM policies WHERE hash=? AND app=? AND variant=? AND agent=? AND brain_hash=?',
                                (candidate,app,variant,agent,self.brain_hash)).fetchone()
            if row is None: raise ValueError('Candidate/model mismatch')
        else:
            row=self.db.execute('SELECT artifact FROM policies WHERE app=? AND variant=? AND agent=? AND brain_hash=? AND adopted=1 ORDER BY version DESC,created DESC LIMIT 1',
                                (app,variant,agent,self.brain_hash)).fetchone()
        if row: return json.loads(row[0])
        return {'schema':'bioagent.full-readout.v1','app':app,'variant':variant,'agent':agent,
                'brainHash':self.brain_hash,'version':1,'mean':[0.]*width,'scale':[1.]*width,
                'weights':np.zeros((ACTIONS[app],width+1)).tolist()}

    @staticmethod
    def scores(policy, features):
        x=np.asarray(features,dtype=float)
        mean=np.asarray(policy['mean']);scale=np.asarray(policy['scale'])
        if x.shape!=mean.shape or not np.isfinite(x).all(): raise ValueError('Feature/model mismatch')
        if policy.get('algorithm')=='regression-tree':
            return np.array([predict_tree(tree,x) for tree in policy['trees']])
        return np.asarray(policy['weights'])@np.r_[1.,np.clip((x-mean)/scale,-20,20)]

    def decision(self, app, variant, agent, session, phase, features, action, version, observation, source):
        if app not in APPS or variant not in ('full','legacy') or agent not in (0,1):
            raise ValueError('Invalid individual/application')
        if phase not in ('collect','live','selection','test') or type(action) is not int or not 0<=action<ACTIONS[app]:
            raise ValueError('Invalid phase/action')
        if not np.isfinite(features).all(): raise ValueError('Invalid features')
        identifier=uuid.uuid4().hex
        self.db.execute('INSERT INTO decisions VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)',
                        (identifier,app,variant,agent,self.brain_hash,session,phase,json.dumps(features),action,version,
                         json.dumps(observation),json.dumps(source),time.time()))
        self.db.commit()
        return identifier

    def outcome(self, identifier, reward, metrics, source):
        if type(reward) not in (float,int) or not np.isfinite(reward): raise ValueError('Non-finite reward')
        self.db.execute('INSERT INTO outcomes VALUES(?,?,?,?,?)',
                        (identifier,reward,json.dumps(metrics),json.dumps(source),time.time()))
        self.db.commit()

    def train(self, app, variant, agent):
        started=time.perf_counter()
        rows=self.db.execute('''SELECT d.id,d.features,d.action,o.reward FROM decisions d JOIN outcomes o ON d.id=o.decision_id
          WHERE d.app=? AND d.variant=? AND d.agent=? AND d.brain_hash=? AND d.phase IN ('collect','live')
          ORDER BY d.created,d.id''',(app,variant,agent,self.brain_hash)).fetchall()
        if len(rows)<48: raise ValueError('At least 48 observed action outcomes are required')
        x=np.asarray([json.loads(r[1]) for r in rows]);actions=np.array([r[2] for r in rows]);y=np.array([r[3] for r in rows])
        split=int(len(rows)*.7)
        previous=self.policy(app,variant,agent,x.shape[1])
        mean=x[:split].mean(axis=0);scale=np.maximum(x[:split].std(axis=0),1e-3)
        features=np.column_stack([np.ones(len(x)),np.clip((x-mean)/scale,-20,20)])
        weights=np.zeros((ACTIONS[app],features.shape[1]));counts=[]
        for action in range(ACTIONS[app]):
            mask=actions[:split]==action;counts.append(int(mask.sum()))
            if mask.sum()<3: raise ValueError('Insufficient observed outcomes for action '+str(action))
            a=features[:split][mask];target=y[:split][mask]
            ridge=np.eye(a.shape[1])*.1;ridge[0,0]=.001
            weights[action]=np.linalg.solve(a.T@a+ridge,a.T@target)
        candidate={**previous,'version':previous['version']+1,'mean':mean.tolist(),'scale':scale.tolist(),
                   'weights':weights.tolist(),'algorithm':'ridge-linear',
                   'learnerHash':digest({'learner':sha(Path(__file__)),'readout':sha(Path(__file__).with_name('readout.py'))}),
                   'trainingDecisionIds':[r[0] for r in rows[:split]],
                   'selectionDecisionIds':[r[0] for r in rows[split:]]}
        # Select the reward readout using only the collection's reserved prediction partition.
        selection_metrics={}
        if app=='market':
            tree_candidate={**candidate,'algorithm':'regression-tree',
                'trees':[fit_tree(x[:split][actions[:split]==a],y[:split][actions[:split]==a]) for a in range(ACTIONS[app])]}
            for name,model in [('ridge-linear',candidate),('regression-tree',tree_candidate)]:
                prediction=np.array([self.scores(model,row)[action] for row,action in zip(x[split:],actions[split:])])
                selection_metrics[name]=float(np.mean((prediction-y[split:])**2))
            if selection_metrics['regression-tree']<selection_metrics['ridge-linear']: candidate=tree_candidate
        pred_before=np.array([self.scores(previous,row)[action] for row,action in zip(x[split:],actions[split:])])
        pred_after=np.array([self.scores(candidate,row)[action] for row,action in zip(x[split:],actions[split:])])
        before=float(np.mean((pred_before-y[split:])**2));after=float(np.mean((pred_after-y[split:])**2))
        report={'schema':'bioagent.full-learning-run.v1','app':app,'variant':variant,'agent':agent,
                'brainHash':self.brain_hash,'baseVersion':previous['version'],'candidateVersion':candidate['version'],
                'trainingSamples':split,'selectionSamples':len(rows)-split,'actionSamples':counts,
                'predictionMetric':'held-out immediate reward MSE',
                'beforeMSE':before,'afterMSE':after,'predictionImproved':after<before,
                'algorithm':candidate['algorithm'],'predictionSelectionMSE':selection_metrics,
                'trainingMs':(time.perf_counter()-started)*1000,'adopted':False,
                'changed':'action-readout only; every classified neuron remains in inference',
                'adoptionRequires':'fresh behavioral evaluation; prediction MSE alone is insufficient'}
        candidate['report']=dict(report)
        hash_=digest(candidate)
        report['candidateHash']=hash_
        self.db.execute('INSERT OR IGNORE INTO policies VALUES(?,?,?,?,?,?,?,?,?)',
                        (hash_,app,variant,agent,self.brain_hash,candidate['version'],json.dumps(candidate),0,time.time()))
        self.db.execute('INSERT INTO learning_runs VALUES(?,?,?)',(uuid.uuid4().hex,json.dumps(report),time.time()))
        self.db.commit()
        return report

    def adopt(self, candidate_hash, evaluation):
        row=self.db.execute('SELECT artifact,adopted FROM policies WHERE hash=? AND brain_hash=?',
                            (candidate_hash,self.brain_hash)).fetchone()
        if row is None: raise ValueError('Unknown candidate')
        candidate=json.loads(row[0])
        if row[1]: raise ValueError('Already adopted')
        current=self.policy(candidate['app'],candidate['variant'],candidate['agent'],len(candidate['mean']))
        if current['version']!=candidate['version']-1: raise ValueError('Stale candidate')
        required=('before','after','metric','evaluationDecisionIds')
        if any(k not in evaluation for k in required): raise ValueError('Behavioral evaluation required')
        if not np.isfinite([evaluation['before'],evaluation['after']]).all(): raise ValueError('Non-finite evaluation')
        ids=evaluation['evaluationDecisionIds']
        if not isinstance(ids,list) or len(ids)<16 or len(set(ids))!=len(ids): raise ValueError('Fresh evaluation decisions required')
        observed={current['version']:[],candidate['version']:[]}
        cases={version:[] for version in observed}
        for identifier in ids:
            entry=self.db.execute('SELECT app,variant,agent,brain_hash,phase,policy_version,source FROM decisions WHERE id=?',(identifier,)).fetchone()
            if entry is None or entry[:5]!=(candidate['app'],candidate['variant'],candidate['agent'],self.brain_hash,'selection') or entry[5] not in observed:
                raise ValueError('Evaluation provenance mismatch')
            source=json.loads(entry[6])
            expected_hash=candidate_hash if entry[5]==candidate['version'] else digest(current)
            if source.get('policyHash')!=expected_hash or not source.get('evaluationCase'):
                raise ValueError('Evaluation policy or case identity missing')
            cases[entry[5]].append(source['evaluationCase'])
            outcome=self.db.execute('SELECT reward FROM outcomes WHERE decision_id=?',(identifier,)).fetchone()
            if outcome is None: raise ValueError('Evaluation outcome missing')
            observed[entry[5]].append(outcome[0])
        a,b=observed[current['version']],observed[candidate['version']]
        if cases[current['version']]!=cases[candidate['version']]: raise ValueError('Evaluation cases differ')
        if len(a)<8 or len(a)!=len(b): raise ValueError('Paired before/after rollout lengths required')
        if not np.allclose([np.mean(a),np.mean(b)],[evaluation['before'],evaluation['after']],rtol=0,atol=1e-12):
            raise ValueError('Reported improvement does not match observed rewards')
        accepted=evaluation['after']>evaluation['before']+1e-9
        report={**candidate['report'],'evaluation':evaluation,'adopted':accepted,'candidateHash':candidate_hash,
                'version':candidate['version'] if accepted else current['version']}
        # Learned weights artifact is immutable; store evaluation separately.
        if accepted: self.db.execute('UPDATE policies SET adopted=1 WHERE hash=?',(candidate_hash,))
        self.db.execute('INSERT INTO learning_runs VALUES(?,?,?)',(uuid.uuid4().hex,json.dumps(report),time.time()))
        self.db.commit()
        return report

    def summary(self):
        rows=self.db.execute('''SELECT d.app,d.variant,d.agent,d.phase,COUNT(*),COUNT(o.decision_id),COALESCE(SUM(o.reward),0)
          FROM decisions d LEFT JOIN outcomes o ON o.decision_id=d.id WHERE d.brain_hash=?
          GROUP BY d.app,d.variant,d.agent,d.phase''',(self.brain_hash,)).fetchall()
        return {'experiences':[dict(zip(['app','variant','agent','phase','decisions','outcomes','reward'],r)) for r in rows],
                'learningRuns':[json.loads(r[0]) for r in self.db.execute('SELECT artifact FROM learning_runs ORDER BY created DESC LIMIT 30')]}
