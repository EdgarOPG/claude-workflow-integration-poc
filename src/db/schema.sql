CREATE TABLE IF NOT EXISTS todos (
  id         SERIAL PRIMARY KEY,
  title      TEXT NOT NULL,
  completed  BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
