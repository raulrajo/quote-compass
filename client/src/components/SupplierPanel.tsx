import { useState } from 'react'
import { api, ApiError } from '../lib/api'
import type { Supplier } from '../types'
import { Button, Card, ErrorBanner, inputClass, Spinner } from './ui'

export function SupplierPanel({
  suppliers,
  onChanged,
}: {
  suppliers: Supplier[]
  onChanged: () => void
}) {
  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function add() {
    setError('')
    setBusy(true)
    try {
      await api.createSupplier({ name, location: location || undefined })
      setName('')
      setLocation('')
      onChanged()
    } catch (err) {
      setError((err as ApiError).message)
    } finally {
      setBusy(false)
    }
  }

  async function remove(id: string) {
    await api.deleteSupplier(id)
    onChanged()
  }

  return (
    <Card className="space-y-3">
      <div className="font-medium text-slate-900">Suppliers</div>
      {suppliers.length > 0 && (
        <ul className="divide-y divide-slate-100 text-sm">
          {suppliers.map((s) => (
            <li key={s._id} className="flex items-center justify-between py-1.5">
              <span>
                {s.name}
                {s.location && <span className="text-slate-400"> · {s.location}</span>}
              </span>
              <button onClick={() => remove(s._id)} className="text-xs text-slate-400 hover:text-red-500">
                remove
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2">
        <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="Supplier name" />
        <input className={`${inputClass} max-w-40`} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location" />
        <Button variant="secondary" onClick={add} disabled={!name.trim() || busy}>
          {busy ? <Spinner /> : 'Add'}
        </Button>
      </div>
      {error && <ErrorBanner message={error} />}
    </Card>
  )
}
