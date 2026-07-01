import type { Request, Response, NextFunction } from 'express'

/**
 * Every request is scoped to a browser session id (sent as `x-session-id`).
 * This keeps public-demo visitors' data isolated without requiring auth.
 */
export function requireSession(req: Request, res: Response, next: NextFunction): void {
  const sessionId = req.header('x-session-id')?.trim()
  if (!sessionId) {
    res.status(400).json({ error: 'Missing x-session-id header.' })
    return
  }
  res.locals.sessionId = sessionId
  next()
}

/** The current request's session id (set by requireSession). */
export function sessionId(res: Response): string {
  return res.locals.sessionId as string
}

/**
 * Pull the caller's Anthropic API key from the `x-llm-key` header.
 * Bring-your-own-key: it lives only for the duration of the request.
 */
export function requireLlmKey(req: Request): string {
  const key = req.header('x-llm-key')?.trim()
  if (!key) {
    const err = new Error('No API key provided. Add your Anthropic key in Settings.') as Error & {
      status?: number
    }
    err.status = 401
    throw err
  }
  return key
}
