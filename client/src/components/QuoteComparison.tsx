import { useState } from 'react'
import { api, ApiError } from '../lib/api'
import type { Quote, Recommendation } from '../types'
import { money, days, num, text } from '../lib/format'
import { Button, Card, ErrorBanner, Spinner } from './ui'
import { FollowUpModal } from './FollowUpModal'

export function QuoteComparison({
  rfqId,
  quotes,
  onChanged,
}: {
  rfqId: string
  quotes: Quote[]
  onChanged: () => void
}) {
  const [rec, setRec] = useState<Recommendation | null>(null)
  const [recBusy, setRecBusy] = useState(false)
  const [error, setError] = useState('')
  const [draft, setDraft] = useState<{ supplier: string; message: string; loading: boolean } | null>(null)

  const scoreByQuote = new Map(rec?.scores.map((s) => [s.quoteId, s]) ?? [])

  async function getRecommendation() {
    setError('')
    setRecBusy(true)
    try {
      setRec(await api.recommend(rfqId))
    } catch (err) {
      setError((err as ApiError).message)
    } finally {
      setRecBusy(false)
    }
  }

  async function draftFollowUp(quote: Quote) {
    setDraft({ supplier: quote.supplierId.name, message: '', loading: true })
    try {
      const { message } = await api.draftFollowUp(quote._id)
      setDraft({ supplier: quote.supplierId.name, message, loading: false })
    } catch (err) {
      setDraft(null)
      setError((err as ApiError).message)
    }
  }

  async function remove(id: string) {
    await api.deleteQuote(id)
    setRec(null)
    onChanged()
  }

  if (quotes.length === 0) {
    return (
      <Card className="text-center text-sm text-slate-500">
        No quotes yet. Add a supplier and paste their quote above to start comparing.
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Comparison</h2>
        <Button onClick={getRecommendation} disabled={recBusy}>
          {recBusy ? <Spinner /> : '🧭'} {rec ? 'Re-run recommendation' : 'Get AI recommendation'}
        </Button>
      </div>

      {error && <ErrorBanner message={error} />}

      {rec && (
        <Card className="border-sky-200 bg-sky-50">
          <div className="text-sm font-semibold text-sky-900">{rec.headline}</div>
          <p className="mt-1 text-sm text-slate-700">{rec.reasoning}</p>
        </Card>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2">Supplier</th>
              <th className="px-4 py-2">Unit price</th>
              <th className="px-4 py-2">Total</th>
              <th className="px-4 py-2">Lead time</th>
              <th className="px-4 py-2">MOQ</th>
              <th className="px-4 py-2">Terms</th>
              {rec && <th className="px-4 py-2">Score</th>}
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {quotes.map((q) => {
              const isPick = rec?.recommendedQuoteId === q._id
              const score = scoreByQuote.get(q._id)
              return (
                <tr key={q._id} className={isPick ? 'bg-emerald-50' : ''}>
                  <td className="px-4 py-2 font-medium text-slate-800">
                    {q.supplierId.name}
                    {isPick && (
                      <span className="ml-2 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                        RECOMMENDED
                      </span>
                    )}
                    {q.extractionConfidence != null && (
                      <div className="text-[11px] text-slate-400">
                        extraction {Math.round(q.extractionConfidence * 100)}%
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2">{money(q.parsed.unitPrice, q.parsed.currency)}</td>
                  <td className="px-4 py-2">{money(q.parsed.totalPrice, q.parsed.currency)}</td>
                  <td className="px-4 py-2">{days(q.parsed.leadTimeDays)}</td>
                  <td className="px-4 py-2">{num(q.parsed.moq)}</td>
                  <td className="px-4 py-2 text-slate-600">{text(q.parsed.paymentTerms)}</td>
                  {rec && (
                    <td className="px-4 py-2">
                      {score ? (
                        <span
                          className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700"
                          title={[...score.pros.map((p) => `+ ${p}`), ...score.cons.map((c) => `– ${c}`)].join('\n')}
                        >
                          {score.score}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                  )}
                  <td className="px-4 py-2">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" onClick={() => draftFollowUp(q)} title="Draft follow-up email">
                        ✉️
                      </Button>
                      <Button variant="danger" onClick={() => remove(q._id)} title="Delete quote">
                        🗑
                      </Button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {draft && (
        <FollowUpModal
          supplierName={draft.supplier}
          message={draft.message}
          loading={draft.loading}
          onClose={() => setDraft(null)}
        />
      )}
    </div>
  )
}
