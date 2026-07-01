import { Router } from 'express'
import { requireSession, sessionId } from '../middleware/context.js'
import { asyncHandler } from '../middleware/errors.js'
import { rfqsRouter } from './rfqs.js'
import { suppliersRouter } from './suppliers.js'
import { quotesRouter } from './quotes.js'
import { seedSession, clearSession } from '../services/seed.js'

/** All data endpoints are scoped to the caller's browser session. */
export const apiRouter = Router()

apiRouter.use(requireSession)
apiRouter.use('/rfqs', rfqsRouter)
apiRouter.use('/suppliers', suppliersRouter)
apiRouter.use('/quotes', quotesRouter)

/** Load the sample dataset into the current session. */
apiRouter.post(
  '/seed',
  asyncHandler(async (_req, res) => {
    await seedSession(sessionId(res))
    res.status(201).json({ ok: true })
  }),
)

/** Wipe the current session's data. */
apiRouter.post(
  '/reset',
  asyncHandler(async (_req, res) => {
    await clearSession(sessionId(res))
    res.status(204).end()
  }),
)
