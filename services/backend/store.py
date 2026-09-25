import json
import sqlite3
from pathlib import Path


class Store:
    def __init__(self, path: str):
        Path(path).parent.mkdir(parents=True, exist_ok=True)
        self.connection = sqlite3.connect(path)
        self.connection.execute('CREATE TABLE IF NOT EXISTS runs (id INTEGER PRIMARY KEY, payload TEXT NOT NULL)')
        self.connection.commit()

    def save(self, payload: dict) -> dict:
        with self.connection:
            cursor = self.connection.execute('INSERT INTO runs (payload) VALUES (?)', (json.dumps(payload),))
        return {'id': cursor.lastrowid, **payload}

    def recent(self) -> list[dict]:
        rows = self.connection.execute('SELECT id, payload FROM runs ORDER BY id DESC LIMIT 50')
        return [{'id': row[0], **json.loads(row[1])} for row in rows]

    def close(self):
        self.connection.close()
