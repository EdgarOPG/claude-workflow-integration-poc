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
