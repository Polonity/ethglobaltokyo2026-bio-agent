"""Import the two reviewed demo readouts only when no adopted policy exists.
This is artifact restoration, not a training run or a new adoption evaluation.
"""
import json
import os
import time
from pathlib import Path
from packages.bio_agent.full.model import ROOT
from packages.bio_agent.full_apps.brain import BrainPool, digest
from packages.bio_agent.full_apps.learning import ExperienceStore

brain = BrainPool()
bundle = json.loads((ROOT / 'docs/submission/evidence/aqua-policies.json').read_text())
assert bundle['schema'] == 'bioagent.submission-policies.v1'
assert len(bundle['policies']) == 2
validated = []
for index, item in enumerate(bundle['policies']):
    policy = item['artifact']
    assert policy['app'] == 'aqua' and policy['variant'] == 'full' and policy['agent'] == index
    assert policy['brainHash'] == brain.hash and digest(policy) == item['hash']
    validated.append((item['hash'], policy))
path = ROOT / Path(os.environ.get('FULL_APPS_STATE_DIR', '.local/aqua-fork'))
path.mkdir(parents=True, exist_ok=True)
store = ExperienceStore(path / 'experience.sqlite3', brain.hash)
restored = 0
for hash_, policy in validated:
    existing = store.db.execute("SELECT 1 FROM policies WHERE app='aqua' AND variant='full' AND agent=? AND brain_hash=? AND adopted=1", (policy['agent'], brain.hash)).fetchone()
    if existing:
        continue
    store.db.execute('INSERT INTO policies VALUES(?,?,?,?,?,?,?,?,?)',
        (hash_, 'aqua', 'full', policy['agent'], brain.hash, policy['version'], json.dumps(policy), 1, time.time()))
    restored += 1
store.db.commit()
store.db.close()
print(json.dumps({'restoredReadouts': restored, 'brainHash': brain.hash, 'trainingPerformed': False}))
