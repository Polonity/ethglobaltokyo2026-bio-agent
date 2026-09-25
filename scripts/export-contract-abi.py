"""Export only public contract ABIs using the project's pinned compiler settings."""
import json
import os
from pathlib import Path
import subprocess

root = Path(__file__).resolve().parents[1]
forge = os.environ.get('FORGE', 'forge')
for name in ('IBioAgent', 'IBioAgentRegistry', 'IBioAgentWallet', 'BioAgentRegistry', 'IBioAgentStimulus', 'BioAgentNFT', 'BioAgentSBT'):
    result = subprocess.run(
        [forge, 'inspect', name, 'abi', '--json'],
        cwd=root / 'contracts', check=True, capture_output=True, text=True,
    )
    abi = json.loads(result.stdout)
    (root / 'contracts' / 'abi' / f'{name}.json').write_text(
        json.dumps(abi, indent=2) + '\n', encoding='utf-8',
    )
    print(f'Exported {name} ABI')
