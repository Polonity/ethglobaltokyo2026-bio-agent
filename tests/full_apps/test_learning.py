import json
import sqlite3
import tempfile
import unittest
from pathlib import Path

from packages.bio_agent.full_apps.learning import ExperienceStore
from packages.bio_agent.full_apps.brain import digest


class LearnedReadoutTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory()
        self.path=Path(self.tmp.name)/'history.sqlite3'
        self.store=ExperienceStore(self.path,'fixture-brain')

    def tearDown(self):
        self.store.db.close()
        self.tmp.cleanup()

    def data(self,app='market',phase='collect',count=96):
        for i in range(count):
            x=[(i%13)/13,(i%7)/7,.4]
            action=i%3
            identifier=self.store.decision(app,'full',0,'training',phase,x,action,1,{}, {'kind':'unit-fixture'})
            self.store.outcome(identifier,x[0]*(action+1),{}, {'kind':'unit-fixture-outcome'})

    def candidate(self):
        self.data()
        return self.store.train('market','full',0)

    def evaluation(self,after=2.):
        ids=[]
        candidate=json.loads(self.store.db.execute('SELECT artifact FROM policies ORDER BY created DESC LIMIT 1').fetchone()[0])
        before=self.store.policy('market','full',0,3)
        for version,reward in [(1,1.),(2,after)]:
            for i in range(8):
                identifier=self.store.decision('market','full',0,'selection','selection',[.5,.2,.4],version-1,version,{}, {'policyHash':digest(before if version==1 else candidate),'evaluationCase':str(i)})
                self.store.outcome(identifier,reward,{}, {})
                ids.append(identifier)
        return {'before':1.,'after':after,'metric':'observed reward','evaluationDecisionIds':ids}

    def test_real_outcomes_required(self):
        with self.assertRaises(ValueError):self.store.train('market','full',0)
        identifier=self.store.decision('market','full',0,'x','collect',[.5],0,1,{}, {})
        self.store.outcome(identifier,1.,{}, {})
        with self.assertRaises(sqlite3.IntegrityError):self.store.outcome(identifier,2.,{}, {})
        self.store.db.rollback()
        with self.assertRaises(sqlite3.IntegrityError):self.store.outcome('unknown',2.,{}, {})
        self.store.db.rollback()

    def test_selection_and_test_excluded_from_training(self):
        self.data(phase='test',count=60)
        self.data(phase='selection',count=60)
        with self.assertRaises(ValueError):self.store.train('market','full',0)
        report=self.candidate()
        self.assertEqual(report['trainingSamples']+report['selectionSamples'],96)
        self.assertFalse(report['adopted'])
        self.assertLess(report['afterMSE'],report['beforeMSE'])

    def test_artifact_identity_and_persistence(self):
        report=self.candidate()
        candidate=self.store.policy('market','full',0,3,report['candidateHash'])
        self.assertEqual(digest(candidate),report['candidateHash'])
        result=self.store.adopt(report['candidateHash'],self.evaluation())
        self.assertTrue(result['adopted'])
        second=ExperienceStore(self.path,'fixture-brain')
        policy=second.policy('market','full',0,3)
        self.assertEqual(policy['version'],2)
        scores=second.scores(policy,[.7,.3,.4])
        self.assertEqual(int(scores.argmax()),2)
        second.db.close()

    def test_cannot_invent_improvement(self):
        report=self.candidate()
        evaluation=self.evaluation();evaluation['after']=1000
        with self.assertRaisesRegex(ValueError,'does not match'):self.store.adopt(report['candidateHash'],evaluation)
        self.assertEqual(self.store.policy('market','full',0,3)['version'],1)

    def test_rejects_worse_behavior_even_after_training(self):
        report=self.candidate()
        result=self.store.adopt(report['candidateHash'],self.evaluation(after=-1))
        self.assertFalse(result['adopted'])
        self.assertEqual(self.store.policy('market','full',0,3)['version'],1)

    def test_unmatched_cases_rejected(self):
        report=self.candidate(); evaluation=self.evaluation()
        identifier=evaluation['evaluationDecisionIds'][-1]
        source=json.loads(self.store.db.execute('SELECT source FROM decisions WHERE id=?',(identifier,)).fetchone()[0])
        source['evaluationCase']='different input sequence'
        self.store.db.execute('UPDATE decisions SET source=? WHERE id=?',(json.dumps(source),identifier));self.store.db.commit()
        with self.assertRaisesRegex(ValueError,'cases differ'):self.store.adopt(report['candidateHash'],evaluation)

    def test_model_and_use_case_isolation(self):
        report=self.candidate()
        with self.assertRaises(ValueError):self.store.policy('aqua','full',0,3,report['candidateHash'])
        with self.assertRaises(ValueError):self.store.policy('market','legacy',0,3,report['candidateHash'])
        other=ExperienceStore(self.path,'different-brain')
        with self.assertRaises(ValueError):other.policy('market','full',0,3,report['candidateHash'])
        other.db.close()


if __name__=='__main__':unittest.main()
