import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, ApiError } from '../lib/api'
import type { Rfq } from '../types'
import { Button, Card, ErrorBanner, Field, inputClass, Spinner } from '../components/ui'

export function RfqListPage() {
  const [rfqs, setRfqs] = useState<Rfq[] | null>(null)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [busy, setBusy] = useState(false)

  async function load() {
    try {
      setRfqs(await api.listRfqs())
    } catch (err) {
      setError((err as ApiError).message)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  async function loadSample() {
    setBusy(true)
    setError('')
    try {
      await api.seed()
      await load()
    } catch (err) {
      setError((err as ApiError).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Requests for Quote</h1>
          <p className="mt-1 text-sm text-slate-500">
            Create an RFQ, paste in the quotes suppliers send back, and let AI structure and compare them.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={loadSample} disabled={busy}>
            {busy ? <Spinner /> : '✨'} Load sample data
          </Button>
          <Button onClick={() => setShowForm((v) => !v)}>+ New RFQ</Button>
        </div>
      </div>

      {error && <ErrorBanner message={error} />}

      {showForm && (
        <NewRfqForm
          onCreated={() => {
            setShowForm(false)
            void load()
          }}
        />
      )}

      {rfqs === null ? (
        <div className="flex justify-center py-12 text-slate-400">
          <Spinner className="h-6 w-6" />
        </div>
      ) : rfqs.length === 0 ? (
        <Card className="text-center text-sm text-slate-500">
          No RFQs yet. Create one, or click <span className="font-medium">Load sample data</span> to
          explore a worked example.
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {rfqs.map((rfq) => (
            <Link key={rfq._id} to={`/rfq/${rfq._id}`}>
              <Card className="h-full transition hover:border-sky-300 hover:shadow-md">
                <div className="font-medium text-slate-900">{rfq.title}</div>
                <div className="mt-1 text-sm text-slate-500">
                  {[rfq.material, rfq.process].filter(Boolean).join(' · ') || 'No details'}
                </div>
                <div className="mt-3 flex gap-4 text-xs text-slate-500">
                  <span>Qty {rfq.quantity.toLocaleString()}</span>
                  {rfq.targetLeadTimeDays != null && <span>Target {rfq.targetLeadTimeDays}d</span>}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function NewRfqForm({ onCreated }: { onCreated: () => void }) {
  const [form, setForm] = useState({
    title: '',
    material: '',
    process: '',
    quantity: '',
    targetLeadTimeDays: '',
    notes: '',
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  function set(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function submit() {
    setError('')
    setSaving(true)
    try {
      await api.createRfq({
        title: form.title,
        material: form.material || undefined,
        process: form.process || undefined,
        quantity: Number(form.quantity),
        targetLeadTimeDays: form.targetLeadTimeDays ? Number(form.targetLeadTimeDays) : undefined,
        notes: form.notes || undefined,
      })
      onCreated()
    } catch (err) {
      setError((err as ApiError).message)
    } finally {
      setSaving(false)
    }
  }

  const valid = form.title.trim() && Number(form.quantity) > 0

  return (
    <Card className="space-y-4">
      <Field label="Title *">
        <input
          className={inputClass}
          value={form.title}
          onChange={(e) => set('title', e.target.value)}
          placeholder="CNC aluminum mounting bracket"
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Material">
          <input className={inputClass} value={form.material} onChange={(e) => set('material', e.target.value)} placeholder="6061-T6 aluminum" />
        </Field>
        <Field label="Process">
          <input className={inputClass} value={form.process} onChange={(e) => set('process', e.target.value)} placeholder="CNC machining" />
        </Field>
        <Field label="Quantity *">
          <input className={inputClass} type="number" value={form.quantity} onChange={(e) => set('quantity', e.target.value)} placeholder="500" />
        </Field>
        <Field label="Target lead time (days)">
          <input className={inputClass} type="number" value={form.targetLeadTimeDays} onChange={(e) => set('targetLeadTimeDays', e.target.value)} placeholder="21" />
        </Field>
      </div>
      <Field label="Notes">
        <textarea className={inputClass} rows={2} value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Anodized, drawing supplied, repeat order likely…" />
      </Field>
      {error && <ErrorBanner message={error} />}
      <div className="flex justify-end">
        <Button onClick={submit} disabled={!valid || saving}>
          {saving && <Spinner />} Create RFQ
        </Button>
      </div>
    </Card>
  )
}
