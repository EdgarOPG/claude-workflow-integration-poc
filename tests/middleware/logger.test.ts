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
