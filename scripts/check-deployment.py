"""Exercise the Forge deployment script against temporary Anvil without broadcasting."""
import json
import os
from pathlib import Path
import socket
import subprocess
import tempfile
import time
from urllib.error import URLError
from urllib.request import Request, urlopen

root = Path(__file__).resolve().parents[1]
forge = os.environ.get('FORGE', 'forge')
anvil = os.environ.get('ANVIL', 'anvil')
with socket.socket() as sock:
    sock.bind(('127.0.0.1', 0))
    port = sock.getsockname()[1]
url = f'http://127.0.0.1:{port}'


def rpc(method, params=None):
    request = Request(url, data=json.dumps({
        'jsonrpc': '2.0', 'id': 1, 'method': method, 'params': params or [],
    }).encode(), headers={'Content-Type': 'application/json'})
    with urlopen(request, timeout=2) as response:
        data = json.load(response)
    if 'error' in data:
        raise RuntimeError(data['error']['message'])
    return data['result']


with tempfile.TemporaryDirectory(prefix='bio-agent-dry-run-') as temporary:
    with open(Path(temporary) / 'anvil.log', 'w') as log:
        node = subprocess.Popen([
            anvil, '--host', '127.0.0.1', '--port', str(port), '--chain-id', '11155111', '--silent',
        ], stdout=log, stderr=log)
        try:
            for _ in range(100):
                if node.poll() is not None:
                    raise RuntimeError('Temporary Anvil exited before startup')
                try:
                    assert int(rpc('eth_chainId'), 16) == 11155111
                    break
                except (URLError, TimeoutError):
                    time.sleep(0.05)
            else:
                raise RuntimeError('Temporary Anvil did not start')
            sender = rpc('eth_accounts')[0]
            before = (rpc('eth_blockNumber'), rpc('eth_getTransactionCount', [sender, 'latest']))
            result = subprocess.run([
                forge, 'script', 'script/DeployBioAgentRegistry.s.sol:DeployBioAgentRegistry',
                '--rpc-url', url, '--sender', sender,
            ], cwd=root / 'contracts', env={**os.environ, 'DEPLOYER_ADDRESS': sender, 'FOUNDRY_BROADCAST': str(Path(temporary) / 'broadcast')},
                capture_output=True, text=True)
            if result.returncode:
                raise RuntimeError('Forge local dry-run failed:\n' + result.stdout + result.stderr)
            after = (rpc('eth_blockNumber'), rpc('eth_getTransactionCount', [sender, 'latest']))
            assert before == after, 'Dry-run must not mine blocks or consume a nonce'
            plans = list((Path(temporary) / 'broadcast').rglob('run-latest.json'))
            assert len(plans) == 1, 'Expected one deployment plan'
            plan = json.loads(plans[0].read_text())
            transactions = plan['transactions']
            assert len(transactions) == 1
            assert transactions[0]['transactionType'] == 'CREATE'
            assert transactions[0]['contractName'] == 'BioAgentRegistry'
            predicted = transactions[0]['contractAddress']
            assert rpc('eth_getCode', [predicted, 'latest']) == '0x'
            print('Anvil RPC dry-run passed: one Registry CREATE planned; no transaction sent; no code deployed.')
        finally:
            node.terminate()
            try:
                node.wait(timeout=5)
            except subprocess.TimeoutExpired:
                node.kill()
                node.wait()
