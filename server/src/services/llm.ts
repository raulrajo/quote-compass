import Anthropic from '@anthropic-ai/sdk'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import type { ZodType } from 'zod'

/**
 * The Claude model powering every LLM step. Defined in one place so swapping
 * models (or letting the deployer override it) is a one-line change.
 */
export const MODEL = 'claude-opus-4-8'

/** A user-facing LLM error carrying an HTTP-ish status for the API layer. */
export class LlmError extends Error {
  status: number
  constructor(message: string, status = 502) {
    super(message)
    this.name = 'LlmError'
    this.status = status
  }
}

/**
 * Ask Claude for JSON validated against a Zod schema (structured outputs).
 * The API key is supplied per request (bring-your-own-key) and never persisted.
 */
export async function completeStructured<T>(opts: {
  apiKey: string
  system: string
  user: string
  schema: ZodType<T>
  maxTokens?: number
}): Promise<T> {
  const client = new Anthropic({ apiKey: opts.apiKey })
  try {
    const res = await client.messages.parse({
      model: MODEL,
      max_tokens: opts.maxTokens ?? 2048,
      system: opts.system,
      output_config: { format: zodOutputFormat(opts.schema) },
      messages: [{ role: 'user', content: opts.user }],
    })
    if (res.parsed_output == null) {
      throw new LlmError('The model did not return valid structured output.')
    }
    return res.parsed_output
  } catch (err) {
    throw toLlmError(err)
  }
}

/** Ask Claude for a plain-text response (e.g. a drafted message). */
export async function completeText(opts: {
  apiKey: string
  system: string
  user: string
  maxTokens?: number
}): Promise<string> {
  const client = new Anthropic({ apiKey: opts.apiKey })
  try {
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: opts.maxTokens ?? 1024,
      system: opts.system,
      messages: [{ role: 'user', content: opts.user }],
    })
    const block = res.content.find((b) => b.type === 'text')
    if (!block || block.type !== 'text') {
      throw new LlmError('The model returned no text.')
    }
    return block.text.trim()
  } catch (err) {
    throw toLlmError(err)
  }
}

/** Map SDK/network errors to friendly, correctly-classified LlmErrors. */
function toLlmError(err: unknown): LlmError {
  if (err instanceof LlmError) return err
  if (err instanceof Anthropic.APIError) {
    if (err.status === 401) {
      return new LlmError('Invalid API key. Check the key in Settings.', 401)
    }
    if (err.status === 429) {
      return new LlmError('Anthropic rate limit hit — wait a moment and retry.', 429)
    }
    return new LlmError(err.message || 'The AI provider returned an error.', err.status ?? 502)
  }
  return new LlmError((err as Error)?.message ?? 'Unexpected AI error.', 502)
}
