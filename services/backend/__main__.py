import json
import os
from dataclasses import asdict
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from urllib.parse import urlsplit

from packages.bio_agent import step
from packages.shared import Stimulus
from services.backend.store import Store

FRONTEND = Path(__file__).resolve().parents[2] / 'dist'
ASSETS = {'/': ('index.html', 'text/html'), '/app.js': ('app.js', 'text/javascript'), '/style.css': ('style.css', 'text/css')}


def make_handler(store: Store):
    class Handler(BaseHTTPRequestHandler):
        def reply(self, status, payload, content_type='application/json'):
            body = json.dumps(payload).encode() if content_type == 'application/json' else payload
            self.send_response(status)
            self.send_header('Content-Type', content_type + '; charset=utf-8')
            self.send_header('Content-Length', str(len(body)))
            self.send_header('Cache-Control', 'no-store')
            self.end_headers()
            self.wfile.write(body)

        def do_GET(self):
            path = urlsplit(self.path).path
            if path == '/api/health':
                return self.reply(200, {'status': 'ok', 'mode': 'mock'})
            if path == '/api/runs':
                return self.reply(200, {'runs': store.recent()})
            if path in ASSETS:
                name, content_type = ASSETS[path]
                return self.reply(200, (FRONTEND / name).read_bytes(), content_type)
            self.reply(404, {'error': 'not_found'})

        def do_POST(self):
            if self.path != '/api/demo/step':
                return self.reply(404, {'error': 'not_found'})
            # Persisted sequence continues after restarts. Single-process demo only.
            latest = store.recent()
            number = latest[0]['id'] + 1 if latest else 1
            stimulus = Stimulus('mock', None, number, f'mock:{number}', ((number * 37) % 100) / 100)
            state = step(stimulus)
            run = store.save({
                'schema_version': 1,
                'created_at': datetime.now(timezone.utc).isoformat(),
                'stimulus': asdict(stimulus),
                'state': asdict(state),
            })
            self.reply(201, run)
    return Handler


def main():
    store = Store(os.environ.get('BIO_AGENT_DB', 'data/bio-agent.sqlite3'))
    server = HTTPServer((os.environ.get('HOST', '127.0.0.1'), int(os.environ.get('PORT', '8000'))), make_handler(store))
    print(f'Bio Agent demo: http://{server.server_address[0]}:{server.server_address[1]}', flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
        store.close()


if __name__ == '__main__':
    main()
