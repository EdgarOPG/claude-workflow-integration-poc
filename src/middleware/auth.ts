import type { MiddlewareHandler } from 'hono'

export const authMiddleware: MiddlewareHandler = async (c, next) => {
  const header = c.req.header('Authorization') ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null

  if (!token || token !== process.env.AUTH_TOKEN) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  await next()
}
