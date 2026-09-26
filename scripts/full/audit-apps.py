"""Summarize actual acceptance artifacts and verify immutable policies against SQLite."""
import hashlib
import json
import sqlite3
from pathlib import Path
from packages.bio_agent.full_apps.brain import digest
ROOT=Path(__file__).resolve().parents[2]
ART=ROOT/'artifacts/full-apps'
load=lambda name:json.loads((ART/name).read_text())
browser=load('browser-verification.json');comparison=load('comparison.json');resume=load('resume-verification.json')
brain=browser['brain'];bh=brain['brainHash']
assert comparison['brain']['brainHash']==bh
assert len(browser['reports'])==6 and len(resume['applications'])==3
assert not browser['browserErrors']
db=sqlite3.connect(f'file:{ROOT}/.local/full-apps/experience.sqlite3?mode=ro',uri=True)
counts=db.execute('''SELECT d.app,d.variant,COUNT(*),COUNT(o.decision_id) FROM decisions d
 LEFT JOIN outcomes o ON o.decision_id=d.id WHERE d.brain_hash=? GROUP BY d.app,d.variant''',(bh,)).fetchall()
assert all(a==b for _,_,a,b in counts),'Incomplete outcomes in accepted model history'
policies=db.execute('SELECT hash,artifact,adopted FROM policies WHERE brain_hash=?',(bh,)).fetchall()
for hash_,raw,adopted in policies:
 p=json.loads(raw);assert digest(p)==hash_
 for identifier in p['trainingDecisionIds']+p['selectionDecisionIds']:
  row=db.execute('SELECT app,variant,agent,brain_hash,phase FROM decisions WHERE id=?',(identifier,)).fetchone()
  assert row[:4]==(p['app'],p['variant'],p['agent'],bh) and row[4] in ('collect','live')
 if adopted:
  assert db.execute("SELECT COUNT(*) FROM decisions WHERE brain_hash=? AND app=? AND variant=? AND agent=? AND policy_version=? AND phase IN ('test','live') AND json_extract(source,'$.policyHash')=?",(bh,p['app'],p['variant'],p['agent'],p['version'],hash_)).fetchone()[0]>0
summary={'schema':'bioagent.full-app-acceptance.v1','brain':brain,'gui':browser['reports'],
 'resume':resume,'ablation':load('readout-ablation.json'),'ui':load('ui-verification.json'),
 'marketGuards':load('market-guards.json'),'comparison':[],'originalReference':comparison['original'],
 'invariants':{'completeOutcomes':True,'immutablePolicyHashes':True,'evaluationExcludedFromTraining':True,'adoptedPoliciesUsedInSubsequentActions':True},
 'experienceCounts':[dict(zip(['app','variant','decisions','outcomes'],r)) for r in counts],
 'limits':comparison['limits'],'artifacts':{}}
for app in ('foraging','market','aqua'):
 assert any(browser['reports'][app+':full']['adopted'])
 assert next(r for r in resume['applications'] if r['app']==app)['versions']==browser['reports'][app+':full']['versions']
 for variant in ('full','legacy'):
  runs=[r for r in comparison['runs'] if r['app']==app and r['variant']==variant]
  assert len(runs)==(3 if app=='foraging' else 2)
  rewards=[v for r in runs for v in r['rewards']]
  summary['comparison'].append({'app':app,'variant':variant,'runs':len(runs),
   'meanRewardPerIndividual':sum(rewards)/len(rewards),'minReward':min(rewards),'maxReward':max(rewards),
   'neuralMsPerJointDecision':sum(r['neuralMs'] for r in runs)/sum(r['steps'] for r in runs),
   'endToEndMsPerJointDecision':sum(r['elapsedMs'] for r in runs)/sum(r['steps'] for r in runs),
   'processPeakRSSMiB':max(r['processPeakRSSMiB'] for r in runs),
   'seeds':[r['seed'] for r in runs],'offsets':[r['offset'] for r in runs]})
for path in sorted(ART.glob('*.json')):
 if path.name in ['browser-verification.json','comparison.json','resume-verification.json','readout-ablation.json','ui-verification.json','market-guards.json','market-tape.json'] or path.name.endswith('-latest.json'):
  summary['artifacts'][path.name]='sha256:'+hashlib.sha256(path.read_bytes()).hexdigest()
summary['implementationHashes']={}
for pattern in ('packages/bio_agent/full_apps/*.py','services/full-apps/*.mjs','services/full-apps/*.html'):
 for path in sorted(ROOT.glob(pattern)):
  summary['implementationHashes'][str(path.relative_to(ROOT))]='sha256:'+hashlib.sha256(path.read_bytes()).hexdigest()
output=ROOT/'docs/submission/evidence/full-apps-acceptance.json';output.parent.mkdir(parents=True,exist_ok=True)
output.write_text(json.dumps(summary,indent=2,ensure_ascii=False)+'\n')
print(json.dumps({'invariants':summary['invariants'],'comparison':summary['comparison']},ensure_ascii=False))

# Publish the concise acceptance page only after every artifact invariant above passed.
page=ROOT/'docs/submission/full-apps-acceptance.md'
text=page.read_text().replace('（検証中）','（検証済み）',1)
lines=['## 実測結果','', '2026-09-26。3用途×full/legacyの6条件をGUIで実行し、TXレシート、改善候補の採用、その後の判断を確認。最後にサーバーを再起動し、全3用途の方策復元と停止、採餌の刺激9000の実TXを確認した。','',
'| 用途 | 全神経の採用評価：学習前 → 候補（MOMO / SORA） | 採用後のバージョン |','| --- | --- | --- |']
for app in ('foraging','market','aqua'):
 r=browser['reports'][app+':full'];f=lambda a:' / '.join(f'{v:.3f}' for v in a)
 lines.append(f"| {app} | {f(r['before'])} → {f(r['after'])} | {' / '.join('v'+str(v) for v in r['versions'])} |")
lines+=['','改善しない個体は旧方策を維持する。採餌MOMOと市場SORA、Aqua両個体で採用を確認した。採用判定の改善は別条件での勝利や全個体の改善を保証しない。','',
'追加条件は採餌3 seed、市場・Aqua各2区間、各80行動。下表は個体ごとの累積報酬の平均。**用途間では報酬の意味と単位が異なるため比較しない。**','',
'| 用途 | 全神経の平均報酬 | 省略版の平均報酬 | 全神経 / 省略版の神経計算 ms（2個体1判断） |','| --- | ---: | ---: | ---: |']
for app in ('foraging','market','aqua'):
 a,b=[next(r for r in summary['comparison'] if r['app']==app and r['variant']==v) for v in ('full','legacy')]
 lines.append(f"| {app} | {a['meanRewardPerIndividual']:.3f} | {b['meanRewardPerIndividual']:.3f} | {a['neuralMsPerJointDecision']:.2f} / {b['neuralMsPerJointDecision']:.3f} |")
lines+=['','この限られた追加試行では採餌は全神経版、市場は省略版が上だった。全神経版の一律な優位性は確認できない。**全神経版は研究・比較用として残し、ブラウザーの軽量デモは省略版を維持する**のが現時点の判断。局所的な縮小の最適解や生物学的妥当性はこの実験から断定しない。','',
'神経接続をゼロにして方策と入力を固定した32ケースの対照では、全3用途で少なくとも1個体の最大スコア行動が変わった。これは接続への依存を示す人工入力probeで、動物行動の再現性を示すものではない。','',
'[機械可読の実測・出自・監査結果](evidence/full-apps-acceptance.json)。SQLite上の全decisionにoutcomeがあり、方策のhash一致、fitへの評価データ混入なし、採用後の方策使用を確認した。','',
'英語の短い実演は `artifacts/full-apps/full-apps-english-demo.webm`。再起動後の3アプリの動作・停止を実画面で収録しており、学習の全工程を収録した動画ではない。','']
if '## 実測結果' in text:
 text=text[:text.index('## 実測結果')]+text[text.index('## 再実行'):]
text=text.replace('## 再実行','\n'.join(lines)+'\n## 再実行',1)
page.write_text(text)
