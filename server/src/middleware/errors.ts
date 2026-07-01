import type { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'
import { LlmError } from '../services/llm.js'

/** Wrap an async route handler so thrown/rejected errors reach the error middleware. */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next)
  }
}

/** Central error handler — turns thrown errors into clean JSON responses. */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  // Invalid request bodies (Zod) are client errors, not server errors.
  if (err instanceof ZodError) {
    const detail = err.issues.map((i) => `${i.path.join('.') || 'body'}: ${i.message}`).join('; ')
    res.status(400).json({ error: `Invalid request — ${detail}` })
    return
  }

  const status =
    err instanceof LlmError
      ? err.status
      : ((err as { status?: number })?.status ?? 500)
  const message = (err as Error)?.message ?? 'Internal server error.'
  if (status >= 500) console.error('[error]', err)
  res.status(status).json({ error: message })
}
