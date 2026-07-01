import { useState } from 'react'
import { Button, Spinner } from './ui'

export function FollowUpModal({
  supplierName,
  message,
  loading,
  onClose,
}: {
  supplierName: string
  message: string
  loading: boolean
  onClose: () => void
}) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    await navigator.clipboard.writeText(message)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-xl rounded-xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-slate-900">Follow-up to {supplierName}</h2>
        {loading ? (
          <div className="flex items-center gap-2 py-10 text-slate-500">
            <Spinner /> Drafting message…
          </div>
        ) : (
          <textarea
            readOnly
            value={message}
            rows={12}
            className="mt-4 w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700"
          />
        )}
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button onClick={copy} disabled={loading}>
            {copied ? '✓ Copied' : 'Copy'}
          </Button>
        </div>
      </div>
    </div>
  )
}
