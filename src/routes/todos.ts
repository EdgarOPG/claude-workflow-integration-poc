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
