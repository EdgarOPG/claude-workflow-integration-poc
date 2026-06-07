import { serve } from '@hono/node-server'
import app from './app.js'
import { initDb } from './db/client.js'

const port = Number(process.env.PORT ?? 3000)

await initDb()

serve({ fetch: app.fetch, port }, () => {
  console.log(`Server running on http://localhost:${port}`)
})
