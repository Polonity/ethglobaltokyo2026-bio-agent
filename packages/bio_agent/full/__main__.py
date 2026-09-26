"""Loopback-only whole-population experiment UI; independent of browser slice demos."""
import argparse
import json
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit

from .model import FullCircuit, DEFAULT_GRAPH


def make_handler(model, port):
    lock = threading.Lock()
    state = {'last': None}
    page = Path(__file__).with_name('index.html').read_bytes()
    allowed_hosts = {f'127.0.0.1:{port}', f'localhost:{port}'}
    checkpoint = DEFAULT_GRAPH / 'local-checkpoint.npz'

    class Handler(BaseHTTPRequestHandler):
        def reply(self, code, payload, content_type='application/json'):
            body = payload if isinstance(payload, bytes) else json.dumps(payload).encode()
            self.send_response(code)
            self.send_header('Content-Type', content_type + '; charset=utf-8')
            self.send_header('Content-Length', str(len(body)))
            self.send_header('Cache-Control', 'no-store')
            self.send_header('X-Content-Type-Options', 'nosniff')
            self.end_headers()
            self.wfile.write(body)

        def trusted(self):
            if self.headers.get('Host') not in allowed_hosts:
                return False
            origin = self.headers.get('Origin')
            return ((origin is None or origin in {'http://' + h for h in allowed_hosts}) and
                    self.headers.get('Sec-Fetch-Site') != 'cross-site')

        def do_GET(self):
            if not self.trusted():
                return self.reply(403, {'error': 'Local origin required'})
            path = urlsplit(self.path).path
            if path == '/':
                return self.reply(200, page, 'text/html')
            if path == '/api/state':
                return self.reply(200, {'graph': model.manifest, 'normalization': model.normalization,
                                        'agents': model.agents, 'kernel': model.kernel, 'loadSeconds': model.load_seconds, 'busy': lock.locked(),
                                        'last': state['last']})
            return self.reply(404, {'error': 'Not found'})

        def do_POST(self):
            if not self.trusted():
                return self.reply(403, {'error': 'Local origin required'})
            if self.path not in ['/api/advance', '/api/reset', '/api/save', '/api/restore']:
                return self.reply(404, {'error': 'Not found'})
            if not lock.acquire(blocking=False):
                return self.reply(409, {'error': 'Full graph calculation in progress'})
            try:
                size = int(self.headers.get('Content-Length', '0'))
                if not 0 <= size <= 4096:
                    raise ValueError('Request too large')
                data = json.loads(self.rfile.read(size) or b'{}')
                if not isinstance(data, dict):
                    raise ValueError('Expected JSON object')
                if self.path == '/api/advance':
                    state['last'] = model.advance(stimuli=data.get('stimuli', [.5]*model.agents),
                        steps=data.get('steps', 32), channel=data.get('channel', 'DNp01'))
                elif self.path == '/api/reset':
                    model.reset()
                    state['last'] = None
                elif self.path == '/api/save':
                    model.save(checkpoint)
                elif self.path == '/api/restore':
                    model.restore(checkpoint)
                    state['last'] = None
                return self.reply(200, {'last': state['last'], 'tick': model.tick})
            except (ValueError, TypeError, KeyError, OSError) as error:
                return self.reply(400, {'error': str(error)})
            finally:
                lock.release()

    return Handler


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--port', type=int, default=8810)
    parser.add_argument('--normalization', choices=['incoming', 'global-max'], default='incoming')
    parser.add_argument('--agents', type=int, choices=[1,2,3], default=2)
    args = parser.parse_args()
    model = FullCircuit(normalization=args.normalization, agents=args.agents)
    server = ThreadingHTTPServer(('127.0.0.1', args.port), make_handler(model, args.port))
    print(json.dumps({'url': f'http://127.0.0.1:{args.port}', 'neuronsPerAgent': len(model.ids),
                      'connections': model.matrix.nnz, 'agents': model.agents,
                      'normalization': model.normalization}), flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == '__main__':
    main()
