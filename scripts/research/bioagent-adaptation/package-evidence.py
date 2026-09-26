from pathlib import Path
import hashlib, json, zipfile

root = Path.cwd()
out = root / 'artifacts/bioagent-adaptation-20260926'
selected = []
for pattern in ['BioAgent-framework-*', 'speaker-script-*.md', 'contact-*.jpg', 'framework-lab-*.png']:
    selected.extend(p for p in out.glob(pattern) if p.suffix != '.zip')
for name in ['experiment.json','development.json','summary.json','body-audit.json','chain.json','browser.json','audit.json','slide-validation.json','tests.txt','findings-ja-en.md']:
    selected.append(out/name)
sources = []
for folder in ['packages/bioagent-framework','packages/bio_agent/research','packages/bio_agent/browser','packages/bio_agent/connectome','packages/bio_agent/runtime','packages/training/browser','scripts/research/bioagent-adaptation','docs/research/bioagent-adaptation','apps/research-lab']:
    sources.extend(p for p in (root/folder).rglob('*') if p.is_file())
sources.extend(root/p for p in ['README.md','package.json','package-lock.json','docs/standards/experiment-derived-requirements.md'])
entries = [('evidence/'+p.name,p) for p in sorted(set(selected))]+[('repo/'+str(p.relative_to(root)).replace('\\','/'),p) for p in sorted(set(sources))]
manifest = [{'path':name,'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for name,p in entries]
(out/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8')
readme = '''BioAgent Framework / 2026-09-26

Start with evidence/BioAgent-framework-ja.pdf or evidence/BioAgent-framework-en.pdf.
Editable PPTX, HTML slides, one-minute speaker scripts and bilingual Q&A are included.
The implementation and generated architecture image are under repo/packages/bioagent-framework/.
Full experiment data, body side effects, local EVM records and browser verification are in evidence/.

repo/ is a source snapshot to review within the original monorepo, not a standalone distribution.
Existing repository dependencies, Foundry contracts/submodules and installed runtimes are required
to reproduce the full integration tests. No private keys or live-chain transaction scripts are included.
The chain test itself creates and writes only to its own temporary local Anvil process.

See manifest.json for SHA-256 hashes. The source protocol remained frozen; body telemetry
and optional energy-floor support were added afterwards without changing fitted policies.
audit.json verifies all 10 fits and 1,800 held-out trajectories against the original results.
'''
(out/'START-HERE.txt').write_text(readme,encoding='utf-8')
archive=out/'BioAgent-framework-JA-EN.zip'
with zipfile.ZipFile(archive,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=9) as z:
    for name,p in entries:z.write(p,name)
    z.write(out/'manifest.json','manifest.json');z.write(out/'START-HERE.txt','START-HERE.txt')
with zipfile.ZipFile(archive) as z:
    assert z.testzip() is None
    for record in manifest:assert hashlib.sha256(z.read(record['path'])).hexdigest()==record['sha256']
print(json.dumps({'archive':str(archive),'bytes':archive.stat().st_size,'verifiedFiles':len(manifest)}))
