"""Read-only audit of the new study; no connection to running services."""
import hashlib,json,sqlite3,shutil
from pathlib import Path
ROOT=Path(__file__).resolve().parents[3]
OUT=ROOT/'artifacts/bioagent-study-20260926'
load=lambda n:json.loads((OUT/(n+'.json')).read_text())
protocol=json.loads((ROOT/'docs/research/bioagent-study-20260926/protocol.json').read_text())
assert protocol==load('protocol')
full=load('full-foraging');assert full['complete'] and len(full['records'])==3
totals={'decisions':0,'outcomes':0,'policies':0,'adoptedPolicies':0}
for record in full['records']:
    db=sqlite3.connect(f"file:{OUT}/full-state-{record['trainingSeed']}/experience.sqlite3?mode=ro",uri=True)
    for stage in ['baseline','learned']:
        for run in record[stage]:
            assert run['neurons']==166700 and run['steps']==protocol['fullForaging']['evaluationTicks']
            for agent,ids in enumerate(run['sourceIds']):
                values=[]
                for identifier in ids:
                    phase,reward=db.execute('SELECT d.phase,o.reward FROM decisions d JOIN outcomes o ON o.decision_id=d.id WHERE d.id=?',(identifier,)).fetchone()
                    assert phase=='test';values.append(reward)
                assert abs(sum(values)-run['rewards'][agent])<1e-9
    for hash_,raw,adopted in db.execute('SELECT hash,artifact,adopted FROM policies'):
        artifact=json.loads(raw)
        assert '0x'+hashlib.sha256(json.dumps(artifact,sort_keys=True,separators=(',',':')).encode()).hexdigest()==hash_
        for identifier in artifact['trainingDecisionIds']+artifact['selectionDecisionIds']:
            assert db.execute('SELECT phase FROM decisions WHERE id=?',(identifier,)).fetchone()[0]=='collect'
        totals['policies']+=1;totals['adoptedPolicies']+=adopted
    decisions=db.execute('SELECT COUNT(*) FROM decisions').fetchone()[0]
    outcomes=db.execute('SELECT COUNT(*) FROM outcomes').fetchone()[0]
    assert decisions==outcomes;totals['decisions']+=decisions;totals['outcomes']+=outcomes;db.close()
light=load('light-foraging');assert len(light['records'])==10
assert set(protocol['lightForaging']['testSeeds']).isdisjoint(protocol['lightForaging']['selectionSeeds'])
for record in light['records']:
    assert len(record['rounds'])==5
    for run in record['rounds']:
        assert run['internal']['steps']==960
        if 'tests' in run:
            assert len(run['tests'])==2
            for scenario in run['tests']:
                assert len(scenario['episodes'])==20
                for key in ['food','contacts','reward']:
                    assert abs(sum(e['after'][key] for e in scenario['episodes'])/20-scenario['after'][key])<1e-9
market=load('market');assert len(market['records'])==3
assert all(len(r['tests'])==15 for r in market['records'])
assert market['reuse']['matchedAgentSteps']==24300
for r in market['records']:
    assert all(a['useCase']=='market' for a in r['artifacts'])
    assert all(t['before'][0]['equity']-100==t['before'][0]['pnl'] or abs(t['before'][0]['equity']-100-t['before'][0]['pnl'])<1e-9 for t in r['tests'])
evm=json.loads(Path('/tmp/bioagent-study-evm.json').read_text())
tests=[t for suite in evm.values() for t in suite['test_results'].values()]
assert len(tests)==2 and all(t['status']=='Success' for t in tests)
shutil.copyfile('/tmp/bioagent-study-evm.json',OUT/'evm.json')
source={}
for pattern in ['scripts/research/bioagent-study/*','packages/bio_agent/browser/*.js','packages/bio_agent/connectome/*.js','packages/bio_agent/runtime/*.js','packages/bio_agent/full_apps/*.py','packages/training/browser/*.js','services/full-apps/foraging.mjs','contracts/src/interfaces/IBioAgent.sol','contracts/src/AquaFlyApp.sol','contracts/src/SharedFlyMarket.sol','contracts/test/research/*.sol']:
    for p in ROOT.glob(pattern):
        if p.is_file():source[str(p.relative_to(ROOT))]=hashlib.sha256(p.read_bytes()).hexdigest()
report={'passed':True,'full':totals,'lightTrainingPaths':10,'marketTrainingPaths':3,'marketRestoreAgentSteps':24300,'isolatedEvmTests':2,'readOnlyDatabaseAudit':True,'sourceSha256':source,'limitations':['Descriptive experiment, not a clinical or biological validation','Repeated evaluation layouts are not independent training runs','Synthetic market and quotes, no production efficacy claim','No matched rewired-topology comparison in this study']}
(OUT/'audit.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({k:v for k,v in report.items() if k!='sourceSha256'},indent=2))
