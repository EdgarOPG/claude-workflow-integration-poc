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
