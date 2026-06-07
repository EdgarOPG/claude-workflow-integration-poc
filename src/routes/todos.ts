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

todosRouter.patch('/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const body = await c.req.json<{ title?: string; completed?: boolean }>()

  if (body.title !== undefined && body.title.trim() === '') {
    return c.json({ error: 'title cannot be empty' }, 400)
  }

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
