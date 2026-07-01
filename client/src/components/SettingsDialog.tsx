import { useState } from 'react'
import { getApiKey, setApiKey } from '../lib/session'

interface Props {
  open: boolean
  onClose: () => void
  onSaved: () => void
}

export function SettingsDialog({ open, onClose, onSaved }: Props) {
  const [key, setKey] = useState(getApiKey())
  if (!open) return null

  function save() {
    setApiKey(key.trim())
    onSaved()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-slate-900">Anthropic API key</h2>
        <p className="mt-2 text-sm text-slate-600">
          QuoteCompass uses <span className="font-medium">bring-your-own-key</span>: your Anthropic
          key is stored only in this browser and sent directly with each AI request. It is never
          saved to our database.
        </p>
        <input
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="sk-ant-..."
          className="mt-4 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm focus:border-sky-500 focus:outline-none"
        />
        <p className="mt-2 text-xs text-slate-500">
          Get a key at{' '}
          <a
            href="https://console.anthropic.com/settings/keys"
            target="_blank"
            rel="noreferrer"
            className="text-sky-600 underline"
          >
            console.anthropic.com
          </a>
          . Usage is billed to your own account.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            onClick={save}
            className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
          >
            Save key
          </button>
        </div>
      </div>
    </div>
  )
}
