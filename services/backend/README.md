# Data backend — Python scaffold

A standard-library HTTP server and SQLite store for mock stimulus results. The chain-connected GUI uses the [local Worker](../worker/README.md); its competition state is not persisted here.

## Run

Run `npm ci`, then `make dev` from the repository root. This builds the frontend and starts the Python server.

| Variable     | Default                |
| ------------ | ---------------------- |
| HOST         | 127.0.0.1              |
| PORT         | 8000                   |
| BIO_AGENT_DB | data/bio-agent.sqlite3 |

Designed for one local process. Public authentication, concurrency handling, and schema migrations are not implemented.

## API

| Endpoint              | Response                                                       |
| --------------------- | -------------------------------------------------------------- |
| GET `/api/health`     | status=ok, mode=mock                                           |
| GET `/api/runs`       | Up to 50 runs, newest first                                    |
| POST `/api/demo/step` | No body required; compute and persist one mock input; HTTP 201 |

```sh
curl -fsS http://127.0.0.1:8000/api/health
curl -fsS -X POST http://127.0.0.1:8000/api/demo/step
curl -fsS http://127.0.0.1:8000/api/runs
```

Each POST adds a SQLite record containing an ID, schema_version, created_at, stimulus, and state. Input source is `mock` and chain_id is null. The same database retains history across restarts, but not continuous neural state.

Served GUI assets and `/api/demo/step` are independent. Run `make test`; see [runtime design](../../docs/design/runtime-and-events.md) for the proposed schema.
