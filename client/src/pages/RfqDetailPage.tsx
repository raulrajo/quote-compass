import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api, ApiError } from '../lib/api'
import type { Quote, Rfq, Supplier } from '../types'
import { Button, Card, ErrorBanner, Spinner } from '../components/ui'
import { SupplierPanel } from '../components/SupplierPanel'
import { AddQuote } from '../components/AddQuote'
import { QuoteComparison } from '../components/QuoteComparison'

export function RfqDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const [rfq, setRfq] = useState<Rfq | null>(null)
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const [rfqData, supplierData, quoteData] = await Promise.all([
        api.getRfq(id),
        api.listSuppliers(),
        api.listQuotes(id),
      ])
      setRfq(rfqData)
      setSuppliers(supplierData)
      setQuotes(quoteData)
    } catch (err) {
      setError((err as ApiError).message)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    void load()
  }, [load])

  const reloadQuotes = useCallback(async () => {
    setQuotes(await api.listQuotes(id))
  }, [id])

  const reloadSuppliers = useCallback(async () => {
    setSuppliers(await api.listSuppliers())
  }, [])

  async function deleteRfq() {
    await api.deleteRfq(id)
    navigate('/')
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16 text-slate-400">
        <Spinner className="h-6 w-6" />
      </div>
    )
  }

  if (!rfq) return <ErrorBanner message={error || 'RFQ not found.'} />

  const details = [
    ['Material', rfq.material],
    ['Process', rfq.process],
    ['Quantity', `${rfq.quantity.toLocaleString()} ${rfq.unit ?? 'pcs'}`],
    ['Tolerances', rfq.tolerances],
    ['Target lead time', rfq.targetLeadTimeDays != null ? `${rfq.targetLeadTimeDays} days` : undefined],
  ].filter(([, v]) => v) as [string, string][]

  return (
    <div className="space-y-6">
      <div>
        <Link to="/" className="text-sm text-sky-600 hover:underline">
          ← All RFQs
        </Link>
        <div className="mt-2 flex items-start justify-between">
          <h1 className="text-2xl font-semibold text-slate-900">{rfq.title}</h1>
          <Button variant="danger" onClick={deleteRfq}>
            Delete RFQ
          </Button>
        </div>
      </div>

      {error && <ErrorBanner message={error} />}

      <Card>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
          {details.map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs uppercase tracking-wide text-slate-400">{label}</dt>
              <dd className="text-slate-800">{value}</dd>
            </div>
          ))}
        </dl>
        {rfq.notes && <p className="mt-4 border-t border-slate-100 pt-3 text-sm text-slate-600">{rfq.notes}</p>}
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <SupplierPanel suppliers={suppliers} onChanged={reloadSuppliers} />
        <AddQuote rfqId={id} suppliers={suppliers} onAdded={reloadQuotes} />
      </div>

      <QuoteComparison rfqId={id} quotes={quotes} onChanged={reloadQuotes} />
    </div>
  )
}
