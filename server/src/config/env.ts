import 'dotenv/config'

/** Centralised, validated access to environment configuration. */
export const env = {
  mongoUri: process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/quote-compass',
  port: Number(process.env.PORT ?? 4000),
  corsOrigin: (process.env.CORS_ORIGIN ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  /** Optional fallback key for local dev; the app expects a per-request user key. */
  fallbackAnthropicKey: process.env.ANTHROPIC_API_KEY ?? '',
}
