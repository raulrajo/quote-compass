import { useState } from 'react'
import { api, ApiError } from '../lib/api'
import type { Supplier } from '../types'
import { Button, Card, ErrorBanner, Field, inputClass, Spinner } from './ui'

/**
 * Paste a raw supplier quote and let Claude extract the structured fields.
 * Requires a supplier to exist first.
 */
export function AddQuote({
  rfqId,
  suppliers,
  onAdded,
}: {
  rfqId: string
  suppliers: Supplier[]
  onAdded: () => void
}) {
  const [supplierId, setSupplierId] = useState('')
  const [rawText, setRawText] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit() {
    setError('')
    setBusy(true)
    try {
      await api.addQuote({ rfqId, supplierId, rawText })
      setRawText('')
      setSupplierId('')
      onAdded()
    } catch (err) {
      setError((err as ApiError).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="space-y-3">
      <div className="font-medium text-slate-900">Add a quote</div>
      {suppliers.length === 0 ? (
        <p className="text-sm text-slate-500">Add a supplier first, then paste their quote here.</p>
      ) : (
        <>
          <Field label="Supplier">
            <select className={inputClass} value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
              <option value="">Select a supplier…</option>
              {suppliers.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Raw quote text (paste the supplier's email/message)">
            <textarea
              className={`${inputClass} font-mono`}
              rows={4}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="For 500 pcs we can do $4.20/ea, lead time ~3 weeks, MOQ 100, Net 30…"
            />
          </Field>
          {error && <ErrorBanner message={error} />}
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">AI extracts price, lead time, MOQ, terms…</span>
            <Button onClick={submit} disabled={!supplierId || !rawText.trim() || busy}>
              {busy ? <Spinner /> : '🤖'} Extract &amp; add
            </Button>
          </div>
        </>
      )}
    </Card>
  )
}
