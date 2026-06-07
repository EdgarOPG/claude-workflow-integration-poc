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
