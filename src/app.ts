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
