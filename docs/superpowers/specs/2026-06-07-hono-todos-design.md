# Hono Todos Demo — Design Spec

**Date:** 2026-06-07  
**Stack:** Hono + TypeScript + postgres.js + Docker Compose  
**Pattern:** Layered monolith (routes / middleware / db)

---

## Architecture

```
hono-todos-demo/
├── src/
│   ├── index.ts          # App entry point, mounts middleware and routes
│   ├── routes/
│   │   └── todos.ts      # All todo CRUD route handlers
│   ├── middleware/
│   │   ├── auth.ts       # Bearer token authentication
│   │   └── logger.ts     # Request/response logging
│   └── db/
│       ├── client.ts     # postgres.js connection pool
│       └── schema.sql    # Table DDL (run on startup)
├── docker-compose.yml    # Postgres + app services
├── Dockerfile            # Node 20 Alpine image
├── .env.example          # Placeholder env vars (committed)
├── package.json
├── tsconfig.json
└── .gitignore
```

---

## Data Model

```sql
CREATE TABLE todos (
  id          SERIAL PRIMARY KEY,
  title       TEXT NOT NULL,
  completed   BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

---

## API Endpoints

All endpoints require `Authorization: Bearer <token>` header.

| Method | Path          | Body                        | Description       |
|--------|---------------|-----------------------------|-------------------|
| GET    | `/todos`      | —                           | List all todos    |
| POST   | `/todos`      | `{ title: string }`         | Create todo       |
| PATCH  | `/todos/:id`  | `{ title?, completed? }`    | Update todo       |
| DELETE | `/todos/:id`  | —                           | Delete todo       |

---

## Middleware

Applied globally in this order:

1. **logger.ts** — logs HTTP method, path, response status, duration (ms)
2. **auth.ts** — validates `Authorization: Bearer <token>` against `AUTH_TOKEN` env var; returns `401` on failure

---

## Error Handling

| Scenario              | Status | Response                    |
|-----------------------|--------|-----------------------------|
| Missing/invalid body  | 400    | `{ "error": "<message>" }`  |
| Todo not found        | 404    | `{ "error": "Not found" }`  |
| DB / unhandled error  | 500    | `{ "error": "Internal server error" }` (detail logged server-side) |

Hono's `app.onError` handler catches all unhandled throws.

---

## Environment Variables

```
DATABASE_URL=postgres://user:password@localhost:5432/todos
AUTH_TOKEN=supersecret
PORT=3000
```

---

## Docker Setup

- `docker-compose.yml` defines two services: `postgres` and `app`
- `app` depends on `postgres`, waits for healthy DB before starting
- DB schema applied via `schema.sql` on first run

---

## Git Setup

- `.gitignore` excludes `node_modules/`, `.env`, `dist/`
- `.env.example` committed with placeholder values
- `README.md` includes setup steps and curl examples
- Initial commit includes all scaffolding, ready to push to remote
