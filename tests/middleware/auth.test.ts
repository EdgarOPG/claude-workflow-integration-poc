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
