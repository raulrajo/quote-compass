import express from 'express'
import cors from 'cors'
import { env } from './config/env.js'
import { connectDb } from './config/db.js'
import { apiRouter } from './routes/index.js'
import { errorHandler } from './middleware/errors.js'

const app = express()

app.use(
  cors({
    // Allow any origin when no explicit list is configured (fine for a public demo).
    origin: env.corsOrigin.length > 0 ? env.corsOrigin : true,
    allowedHeaders: ['Content-Type', 'x-session-id', 'x-llm-key'],
  }),
)
app.use(express.json({ limit: '1mb' }))

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }))
app.use('/api', apiRouter)
app.use(errorHandler)

async function start(): Promise<void> {
  await connectDb()
  app.listen(env.port, () => {
    console.log(`[server] QuoteCompass API listening on http://localhost:${env.port}`)
  })
}

start().catch((err) => {
  console.error('[server] failed to start', err)
  process.exit(1)
})
