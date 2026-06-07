# Hono Todos Demo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Todos REST API demo using Hono + TypeScript + postgres.js backed by a Dockerized Postgres instance, with Bearer auth and request logging middleware.

**Architecture:** Layered monolith — `src/app.ts` exports the Hono app for testability, `src/index.ts` starts the server. Routes, middleware, and DB client are separate modules with clear single responsibilities. Tests use Vitest + Hono's built-in `app.request()` helper with a mocked DB client.

**Tech Stack:** Hono, TypeScript, postgres.js, Vitest, Docker Compose, Node 20

---

## File Map

| File | Responsibility |
|------|----------------|
| `package.json` | Dependencies, scripts |
| `tsconfig.json` | TypeScript config |
| `.gitignore` | Exclude node_modules, .env, dist |
| `.env.example` | Placeholder env vars |
| `Dockerfile` | Node 20 Alpine image |
| `docker-compose.yml` | Postgres + app services |
| `src/index.ts` | Start server (import app, listen) |
| `src/app.ts` | Build and export Hono app |
| `src/db/client.ts` | postgres.js connection pool |
| `src/db/schema.sql` | CREATE TABLE todos DDL |
| `src/middleware/logger.ts` | Log method, path, status, duration |
| `src/middleware/auth.ts` | Validate Bearer token vs AUTH_TOKEN env |
| `src/routes/todos.ts` | GET/POST/PATCH/DELETE /todos |
| `tests/middleware/auth.test.ts` | Auth middleware unit tests |
| `tests/middleware/logger.test.ts` | Logger middleware unit tests |
| `tests/routes/todos.test.ts` | Todos route integration tests (DB mocked) |

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `.gitignore`
- Create: `.env.example`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "hono-todos-demo",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "node --watch --experimental-strip-types src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "hono": "^4.4.0",
    "postgres": "^3.4.4",
    "@hono/node-server": "^1.12.0"
  },
  "devDependencies": {
    "@types/node": "^20.14.0",
    "typescript": "^5.4.5",
    "vitest": "^1.6.0"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 3: Create .gitignore**

```
node_modules/
dist/
.env
*.log
```

- [ ] **Step 4: Create .env.example**

```
DATABASE_URL=postgres://todos_user:todos_pass@localhost:5432/todos
AUTH_TOKEN=supersecret
PORT=3000
```

- [ ] **Step 5: Install dependencies**

```bash
npm install
```

Expected: `node_modules/` created, no errors.

- [ ] **Step 6: Commit**

```bash
git add package.json tsconfig.json .gitignore .env.example package-lock.json
git commit -m "chore: project scaffolding"
```

---

### Task 2: Docker Setup

**Files:**
- Create: `Dockerfile`
- Create: `docker-compose.yml`

- [ ] **Step 1: Create Dockerfile**

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY dist/ ./dist/

EXPOSE 3000
CMD ["node", "dist/index.js"]
```

- [ ] **Step 2: Create docker-compose.yml**

```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: todos_user
      POSTGRES_PASSWORD: todos_pass
      POSTGRES_DB: todos
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U todos_user -d todos"]
      interval: 5s
      timeout: 5s
      retries: 5

  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgres://todos_user:todos_pass@postgres:5432/todos
      AUTH_TOKEN: supersecret
      PORT: 3000
    depends_on:
      postgres:
        condition: service_healthy
```

- [ ] **Step 3: Commit**

```bash
git add Dockerfile docker-compose.yml
git commit -m "chore: add Docker and Compose setup"
```

---

### Task 3: DB Client and Schema

**Files:**
- Create: `src/db/client.ts`
- Create: `src/db/schema.sql`

- [ ] **Step 1: Create src/db/schema.sql**

```sql
CREATE TABLE IF NOT EXISTS todos (
  id         SERIAL PRIMARY KEY,
  title      TEXT NOT NULL,
  completed  BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

- [ ] **Step 2: Create src/db/client.ts**

```typescript
import postgres from 'postgres'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

const sql = postgres(process.env.DATABASE_URL!, {
  max: 10,
  idle_timeout: 20,
})

export async function initDb(): Promise<void> {
  const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf-8')
  await sql.unsafe(schema)
}

export default sql
```

- [ ] **Step 3: Commit**

```bash
git add src/db/
git commit -m "feat: add DB client and schema"
```

---

### Task 4: Logger Middleware

**Files:**
- Create: `src/middleware/logger.ts`
- Create: `tests/middleware/logger.test.ts`

- [ ] **Step 1: Write failing test**

Create `tests/middleware/logger.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'
import { loggerMiddleware } from '../../src/middleware/logger.js'

describe('loggerMiddleware', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  it('logs method, path, status and duration', async () => {
    const app = new Hono()
    app.use(loggerMiddleware)
    app.get('/test', (c) => c.json({ ok: true }))

    await app.request('http://localhost/test')

    expect(consoleSpy).toHaveBeenCalledOnce()
    const [msg] = consoleSpy.mock.calls[0]
    expect(msg).toMatch(/GET/)
    expect(msg).toMatch(/\/test/)
    expect(msg).toMatch(/200/)
    expect(msg).toMatch(/ms/)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- tests/middleware/logger.test.ts
```

Expected: FAIL — `Cannot find module '../../src/middleware/logger.js'`

- [ ] **Step 3: Implement logger middleware**

Create `src/middleware/logger.ts`:

```typescript
import type { MiddlewareHandler } from 'hono'

export const loggerMiddleware: MiddlewareHandler = async (c, next) => {
  const start = Date.now()
  await next()
  const duration = Date.now() - start
  console.log(`${c.req.method} ${c.req.path} ${c.res.status} ${duration}ms`)
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- tests/middleware/logger.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/middleware/logger.ts tests/middleware/logger.test.ts
git commit -m "feat: add logger middleware"
```

---

### Task 5: Auth Middleware

**Files:**
- Create: `src/middleware/auth.ts`
- Create: `tests/middleware/auth.test.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/middleware/auth.test.ts`:

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { Hono } from 'hono'
import { authMiddleware } from '../../src/middleware/auth.js'

describe('authMiddleware', () => {
  beforeEach(() => {
    process.env.AUTH_TOKEN = 'test-token'
  })

  afterEach(() => {
    delete process.env.AUTH_TOKEN
  })

  it('allows request with valid Bearer token', async () => {
    const app = new Hono()
    app.use(authMiddleware)
    app.get('/protected', (c) => c.json({ ok: true }))

    const res = await app.request('http://localhost/protected', {
      headers: { Authorization: 'Bearer test-token' },
    })

    expect(res.status).toBe(200)
  })

  it('rejects request with wrong token', async () => {
    const app = new Hono()
    app.use(authMiddleware)
    app.get('/protected', (c) => c.json({ ok: true }))

    const res = await app.request('http://localhost/protected', {
      headers: { Authorization: 'Bearer wrong-token' },
    })

    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body).toEqual({ error: 'Unauthorized' })
  })

  it('rejects request with no Authorization header', async () => {
    const app = new Hono()
    app.use(authMiddleware)
    app.get('/protected', (c) => c.json({ ok: true }))

    const res = await app.request('http://localhost/protected')

    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body).toEqual({ error: 'Unauthorized' })
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- tests/middleware/auth.test.ts
```

Expected: FAIL — `Cannot find module '../../src/middleware/auth.js'`

- [ ] **Step 3: Implement auth middleware**

Create `src/middleware/auth.ts`:

```typescript
import type { MiddlewareHandler } from 'hono'

export const authMiddleware: MiddlewareHandler = async (c, next) => {
  const header = c.req.header('Authorization') ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null

  if (!token || token !== process.env.AUTH_TOKEN) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  await next()
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- tests/middleware/auth.test.ts
```

Expected: 3 PASS

- [ ] **Step 5: Commit**

```bash
git add src/middleware/auth.ts tests/middleware/auth.test.ts
git commit -m "feat: add auth middleware"
```

---

### Task 6: Todos Routes — GET and POST

**Files:**
- Create: `src/routes/todos.ts` (GET + POST only)
- Create: `tests/routes/todos.test.ts` (GET + POST tests)

- [ ] **Step 1: Write failing tests**

Create `tests/routes/todos.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'

// Mock DB before importing routes
vi.mock('../../src/db/client.js', () => {
  const sql = vi.fn() as any
  sql.mockResolvedValue([])
  return { default: sql }
})

import sql from '../../src/db/client.js'
import { todosRouter } from '../../src/routes/todos.js'

const AUTH = 'Bearer test-token'

function buildApp() {
  process.env.AUTH_TOKEN = 'test-token'
  const app = new Hono()
  app.route('/todos', todosRouter)
  return app
}

describe('GET /todos', () => {
  it('returns empty array when no todos', async () => {
    vi.mocked(sql).mockResolvedValueOnce([])
    const app = buildApp()
    const res = await app.request('http://localhost/todos', {
      headers: { Authorization: AUTH },
    })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual([])
  })

  it('returns list of todos', async () => {
    const todos = [
      { id: 1, title: 'Buy milk', completed: false, created_at: new Date() },
    ]
    vi.mocked(sql).mockResolvedValueOnce(todos)
    const app = buildApp()
    const res = await app.request('http://localhost/todos', {
      headers: { Authorization: AUTH },
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toHaveLength(1)
    expect(body[0].title).toBe('Buy milk')
  })
})

describe('POST /todos', () => {
  it('creates a todo and returns 201', async () => {
    const created = { id: 1, title: 'Buy milk', completed: false, created_at: new Date() }
    vi.mocked(sql).mockResolvedValueOnce([created])
    const app = buildApp()
    const res = await app.request('http://localhost/todos', {
      method: 'POST',
      headers: { Authorization: AUTH, 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Buy milk' }),
    })
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.title).toBe('Buy milk')
  })

  it('returns 400 when title is missing', async () => {
    const app = buildApp()
    const res = await app.request('http://localhost/todos', {
      method: 'POST',
      headers: { Authorization: AUTH, 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body).toEqual({ error: 'title is required' })
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- tests/routes/todos.test.ts
```

Expected: FAIL — `Cannot find module '../../src/routes/todos.js'`

- [ ] **Step 3: Implement GET and POST routes**

Create `src/routes/todos.ts`:

```typescript
import { Hono } from 'hono'
import sql from '../db/client.js'

export const todosRouter = new Hono()

todosRouter.get('/', async (c) => {
  const todos = await sql`SELECT * FROM todos ORDER BY created_at DESC`
  return c.json(todos)
})

todosRouter.post('/', async (c) => {
  const body = await c.req.json<{ title?: string }>()
  if (!body.title || body.title.trim() === '') {
    return c.json({ error: 'title is required' }, 400)
  }
  const [todo] = await sql`
    INSERT INTO todos (title) VALUES (${body.title.trim()}) RETURNING *
  `
  return c.json(todo, 201)
})
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- tests/routes/todos.test.ts
```

Expected: 4 PASS

- [ ] **Step 5: Commit**

```bash
git add src/routes/todos.ts tests/routes/todos.test.ts
git commit -m "feat: add GET and POST /todos routes"
```

---

### Task 7: Todos Routes — PATCH and DELETE

**Files:**
- Modify: `src/routes/todos.ts` (add PATCH + DELETE)
- Modify: `tests/routes/todos.test.ts` (add PATCH + DELETE tests)

- [ ] **Step 1: Add failing tests**

Append to `tests/routes/todos.test.ts`:

```typescript
describe('PATCH /todos/:id', () => {
  it('updates a todo and returns it', async () => {
    const updated = { id: 1, title: 'Buy oat milk', completed: true, created_at: new Date() }
    vi.mocked(sql).mockResolvedValueOnce([updated])
    const app = buildApp()
    const res = await app.request('http://localhost/todos/1', {
      method: 'PATCH',
      headers: { Authorization: AUTH, 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Buy oat milk', completed: true }),
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.title).toBe('Buy oat milk')
    expect(body.completed).toBe(true)
  })

  it('returns 404 when todo not found', async () => {
    vi.mocked(sql).mockResolvedValueOnce([])
    const app = buildApp()
    const res = await app.request('http://localhost/todos/999', {
      method: 'PATCH',
      headers: { Authorization: AUTH, 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: true }),
    })
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: 'Not found' })
  })
})

describe('DELETE /todos/:id', () => {
  it('deletes a todo and returns 204', async () => {
    vi.mocked(sql).mockResolvedValueOnce([{ id: 1 }])
    const app = buildApp()
    const res = await app.request('http://localhost/todos/1', {
      method: 'DELETE',
      headers: { Authorization: AUTH },
    })
    expect(res.status).toBe(204)
  })

  it('returns 404 when todo not found', async () => {
    vi.mocked(sql).mockResolvedValueOnce([])
    const app = buildApp()
    const res = await app.request('http://localhost/todos/999', {
      method: 'DELETE',
      headers: { Authorization: AUTH },
    })
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: 'Not found' })
  })
})
```

- [ ] **Step 2: Run tests to verify new ones fail**

```bash
npm test -- tests/routes/todos.test.ts
```

Expected: 4 existing PASS, 4 new FAIL

- [ ] **Step 3: Add PATCH and DELETE to todos router**

Append to `src/routes/todos.ts`:

```typescript
todosRouter.patch('/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const body = await c.req.json<{ title?: string; completed?: boolean }>()

  const [todo] = await sql`
    UPDATE todos
    SET
      title     = COALESCE(${body.title ?? null}, title),
      completed = COALESCE(${body.completed ?? null}, completed)
    WHERE id = ${id}
    RETURNING *
  `
  if (!todo) return c.json({ error: 'Not found' }, 404)
  return c.json(todo)
})

todosRouter.delete('/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const [deleted] = await sql`
    DELETE FROM todos WHERE id = ${id} RETURNING id
  `
  if (!deleted) return c.json({ error: 'Not found' }, 404)
  return new Response(null, { status: 204 })
})
```

- [ ] **Step 4: Run all tests to verify they pass**

```bash
npm test -- tests/routes/todos.test.ts
```

Expected: 8 PASS

- [ ] **Step 5: Commit**

```bash
git add src/routes/todos.ts tests/routes/todos.test.ts
git commit -m "feat: add PATCH and DELETE /todos routes"
```

---

### Task 8: App Entry Point

**Files:**
- Create: `src/app.ts`
- Create: `src/index.ts`

- [ ] **Step 1: Create src/app.ts**

```typescript
import { Hono } from 'hono'
import { loggerMiddleware } from './middleware/logger.js'
import { authMiddleware } from './middleware/auth.js'
import { todosRouter } from './routes/todos.js'

const app = new Hono()

app.use(loggerMiddleware)
app.use(authMiddleware)

app.route('/todos', todosRouter)

app.onError((err, c) => {
  console.error(err)
  return c.json({ error: 'Internal server error' }, 500)
})

export default app
```

- [ ] **Step 2: Create src/index.ts**

```typescript
import { serve } from '@hono/node-server'
import app from './app.js'
import { initDb } from './db/client.js'

const port = Number(process.env.PORT ?? 3000)

await initDb()

serve({ fetch: app.fetch, port }, () => {
  console.log(`Server running on http://localhost:${port}`)
})
```

- [ ] **Step 3: Run full test suite to confirm nothing broken**

```bash
npm test
```

Expected: all tests PASS

- [ ] **Step 4: Commit**

```bash
git add src/app.ts src/index.ts
git commit -m "feat: wire up app entry point with middleware and routes"
```

---

### Task 9: README

**Files:**
- Create: `README.md`

- [ ] **Step 1: Create README.md**

```markdown
# hono-todos-demo

Todos REST API built with [Hono](https://hono.dev/), TypeScript, postgres.js, and Docker Compose.

## Requirements

- Docker + Docker Compose
- Node 20+ (for local dev only)

## Quick Start

### With Docker Compose (production-like)

```bash
# 1. Build and start
npm run build
docker compose up --build

# 2. Test it
curl -H "Authorization: Bearer supersecret" http://localhost:3000/todos
```

### Local Dev (requires Postgres running separately)

```bash
cp .env.example .env
# Edit .env with your local DB credentials
npm install
npm run dev
```

## API

All endpoints require `Authorization: Bearer <AUTH_TOKEN>` header.

| Method | Path          | Body                          | Description    |
|--------|---------------|-------------------------------|----------------|
| GET    | `/todos`      | —                             | List all todos |
| POST   | `/todos`      | `{ "title": "string" }`       | Create todo    |
| PATCH  | `/todos/:id`  | `{ "title"?, "completed"? }`  | Update todo    |
| DELETE | `/todos/:id`  | —                             | Delete todo    |

## Examples

```bash
# Create a todo
curl -X POST http://localhost:3000/todos \
  -H "Authorization: Bearer supersecret" \
  -H "Content-Type: application/json" \
  -d '{"title": "Buy milk"}'

# List todos
curl -H "Authorization: Bearer supersecret" http://localhost:3000/todos

# Complete a todo (replace 1 with actual id)
curl -X PATCH http://localhost:3000/todos/1 \
  -H "Authorization: Bearer supersecret" \
  -H "Content-Type: application/json" \
  -d '{"completed": true}'

# Delete a todo
curl -X DELETE http://localhost:3000/todos/1 \
  -H "Authorization: Bearer supersecret"
```

## Running Tests

```bash
npm test
```
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add README with setup and API examples"
```

---

## Final Verification

- [ ] Run full test suite: `npm test` — all green
- [ ] Build TypeScript: `npm run build` — no errors
- [ ] Confirm git log has clean commits
- [ ] Verify `.env` is NOT committed, `.env.example` IS committed
