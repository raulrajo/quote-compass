// A per-browser session id isolates this visitor's data on the shared demo backend.
const SESSION_KEY = 'qc.sessionId'
const API_KEY = 'qc.apiKey'

export function getSessionId(): string {
  let id = localStorage.getItem(SESSION_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(SESSION_KEY, id)
  }
  return id
}

// Bring-your-own-key: the Anthropic key is stored only in this browser's
// localStorage and sent per request. It never touches our database.
export function getApiKey(): string {
  return localStorage.getItem(API_KEY) ?? ''
}

export function setApiKey(key: string): void {
  if (key) localStorage.setItem(API_KEY, key)
  else localStorage.removeItem(API_KEY)
}
