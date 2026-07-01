import { getApiKey, getSessionId } from './session'
import type { Quote, Recommendation, Rfq, Supplier } from '../types'

// Empty in dev (Vite proxies /api → :4000); set VITE_API_BASE to the API URL in prod.
// Trailing slashes are stripped so `${API_BASE}/api` never becomes `//api`.
const API_BASE = (import.meta.env.VITE_API_BASE ?? '').replace(/\/+$/, '')

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

interface RequestOptions {
  method?: string
  body?: unknown
  /** Attach the user's Anthropic key (only for AI endpoints). */
  withKey?: boolean
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-session-id': getSessionId(),
  }
  if (opts.withKey) {
    const key = getApiKey()
    if (!key) throw new ApiError('Add your Anthropic API key in Settings first.', 401)
    headers['x-llm-key'] = key
  }

  const res = await fetch(`${API_BASE}/api${path}`, {
    method: opts.method ?? 'GET',
    headers,
    body: opts.body != null ? JSON.stringify(opts.body) : undefined,
  })

  if (res.status === 204) return undefined as T
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new ApiError((data as { error?: string }).error ?? 'Request failed', res.status)
  return data as T
}

export const api = {
  // RFQs
  listRfqs: () => request<Rfq[]>('/rfqs'),
  getRfq: (id: string) => request<Rfq>(`/rfqs/${id}`),
  createRfq: (body: Partial<Rfq>) => request<Rfq>('/rfqs', { method: 'POST', body }),
  deleteRfq: (id: string) => request<void>(`/rfqs/${id}`, { method: 'DELETE' }),
  recommend: (id: string) =>
    request<Recommendation>(`/rfqs/${id}/recommend`, { method: 'POST', withKey: true }),

  // Suppliers
  listSuppliers: () => request<Supplier[]>('/suppliers'),
  createSupplier: (body: Partial<Supplier>) => request<Supplier>('/suppliers', { method: 'POST', body }),
  deleteSupplier: (id: string) => request<void>(`/suppliers/${id}`, { method: 'DELETE' }),

  // Quotes
  listQuotes: (rfqId: string) => request<Quote[]>(`/quotes?rfqId=${rfqId}`),
  addQuote: (body: { rfqId: string; supplierId: string; rawText: string }) =>
    request<Quote>('/quotes', { method: 'POST', body, withKey: true }),
  deleteQuote: (id: string) => request<void>(`/quotes/${id}`, { method: 'DELETE' }),
  draftFollowUp: (id: string) =>
    request<{ message: string }>(`/quotes/${id}/draft`, { method: 'POST', withKey: true }),

  // Session data
  seed: () => request<{ ok: true }>('/seed', { method: 'POST' }),
  reset: () => request<void>('/reset', { method: 'POST' }),
}
