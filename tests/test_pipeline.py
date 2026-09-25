import json
import os
from pathlib import Path
import socket
import subprocess
import sys
import tempfile
import time
import unittest
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from packages.bio_agent import step
from packages.shared import Stimulus
from packages.training.__main__ import train
from services.backend.store import Store


class PipelineTests(unittest.TestCase):
    def test_agent_input_and_training_artifact(self):
        for value, expected in [(0, 'rest'), (0.5, 'explore'), (1, 'explore')]:
            self.assertEqual(step(Stimulus('mock', None, 1, 'mock:1', value)).action, expected)
        for value in [-0.1, 1.1, float('nan')]:
            with self.assertRaises(ValueError):
                Stimulus('mock', None, 1, 'mock:1', value)
        artifact = train()
        self.assertEqual(artifact['threshold'], 0.5)
        self.assertFalse(artifact['automatically_applied'])

    def test_live_http_pipeline_and_persistence(self):
        with tempfile.TemporaryDirectory() as directory:
            db = str(Path(directory) / 'runs.sqlite3')
            with socket.socket() as sock:
                sock.bind(('127.0.0.1', 0))
                port = sock.getsockname()[1]
            env = {**os.environ, 'HOST': '127.0.0.1', 'PORT': str(port), 'BIO_AGENT_DB': db}
            process = subprocess.Popen([sys.executable, '-m', 'services.backend'], env=env, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
            base = f'http://127.0.0.1:{port}'

            def fetch(path, method='GET'):
                with urlopen(Request(base + path, method=method), timeout=2) as response:
                    return response.status, response.read()

            try:
                for _ in range(100):
                    if process.poll() is not None:
                        self.fail(process.stderr.read().decode())
                    try:
                        fetch('/api/health')
                        break
                    except (URLError, TimeoutError):
                        time.sleep(0.05)
                else:
                    self.fail('HTTP server did not start')
                self.assertEqual(json.loads(fetch('/api/runs')[1]), {'runs': []})
                self.assertIn(b'Bio Agent Observatory', fetch('/')[1])
                for path in ['/app.js', '/style.css']:
                    self.assertEqual(fetch(path)[0], 200)
                for expected_id in (1, 2):
                    status, body = fetch('/api/demo/step', 'POST')
                    run = json.loads(body)
                    self.assertEqual(status, 201)
                    self.assertEqual(run['id'], expected_id)
                    self.assertEqual(run['stimulus']['source'], 'mock')
                    self.assertIsNone(run['stimulus']['chain_id'])
                runs = json.loads(fetch('/api/runs')[1])['runs']
                self.assertEqual([run['state']['action'] for run in runs], ['explore', 'rest'])
                with self.assertRaises(HTTPError) as caught:
                    fetch('/missing')
                self.assertEqual(caught.exception.code, 404)
            finally:
                process.terminate()
                process.communicate(timeout=5)
            reopened = Store(db)
            try:
                self.assertEqual([run['id'] for run in reopened.recent()], [2, 1])
            finally:
                reopened.close()


if __name__ == '__main__':
    unittest.main()
