import { useState } from 'react'
import { Link, Outlet } from 'react-router-dom'
import { SettingsDialog } from './components/SettingsDialog'
import { getApiKey } from './lib/session'

export function App() {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [hasKey, setHasKey] = useState(Boolean(getApiKey()))

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-xl">🧭</span>
            <div>
              <div className="text-base font-semibold leading-tight text-slate-900">QuoteCompass</div>
              <div className="text-xs text-slate-500">Compare supplier quotes with AI</div>
            </div>
          </Link>
          <button
            onClick={() => setSettingsOpen(true)}
            className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <span className={hasKey ? 'text-emerald-500' : 'text-slate-400'}>●</span>
            {hasKey ? 'API key set' : 'Add API key'}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>

      <footer className="mx-auto max-w-6xl px-4 py-8 text-center text-xs text-slate-400">
        QuoteCompass — a portfolio demo. React · Node/Express · MongoDB · Claude.
      </footer>

      <SettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onSaved={() => setHasKey(Boolean(getApiKey()))}
      />
    </div>
  )
}
