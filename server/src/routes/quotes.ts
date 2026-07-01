import { Router } from 'express'
import { z } from 'zod'
import { QuoteModel } from '../models/Quote.js'
import { RfqModel } from '../models/Rfq.js'
import { SupplierModel } from '../models/Supplier.js'
import { asyncHandler } from '../middleware/errors.js'
import { requireLlmKey, sessionId } from '../middleware/context.js'
import { extractQuote, draftFollowUp } from '../services/quoteAI.js'

export const quotesRouter = Router()

const QuoteInput = z.object({
  rfqId: z.string().min(1),
  supplierId: z.string().min(1),
  rawText: z.string().min(1),
})

/** List quotes for an RFQ, with the supplier populated for display. */
quotesRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const rfqId = String(req.query.rfqId ?? '')
    if (!rfqId) return res.status(400).json({ error: 'rfqId query parameter is required.' })
    const quotes = await QuoteModel.find({ rfqId, sessionId: sessionId(res) })
      .populate('supplierId', 'name contactName email location')
      .sort({ createdAt: 1 })
    res.json(quotes)
  }),
)

/** AI step 1: extract structured fields from a raw quote, then store it. */
quotesRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const apiKey = requireLlmKey(req)
    const sid = sessionId(res)
    const { rfqId, supplierId, rawText } = QuoteInput.parse(req.body)

    const rfq = await RfqModel.findOne({ _id: rfqId, sessionId: sid })
    if (!rfq) return res.status(404).json({ error: 'RFQ not found.' })
    const supplier = await SupplierModel.findOne({ _id: supplierId, sessionId: sid })
    if (!supplier) return res.status(404).json({ error: 'Supplier not found.' })

    const { parsed, confidence, extractionNotes } = await extractQuote(apiKey, rfq.toObject(), rawText)

    const quote = await QuoteModel.create({
      sessionId: sid,
      rfqId,
      supplierId,
      rawText,
      parsed,
      extractionConfidence: confidence,
      extractionNotes: extractionNotes ?? undefined,
    })
    const populated = await quote.populate('supplierId', 'name contactName email location')
    res.status(201).json(populated)
  }),
)

quotesRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await QuoteModel.deleteOne({ _id: req.params.id, sessionId: sessionId(res) })
    res.status(204).end()
  }),
)

/** AI step 3: draft a follow-up message to the quote's supplier. */
quotesRouter.post(
  '/:id/draft',
  asyncHandler(async (req, res) => {
    const apiKey = requireLlmKey(req)
    const sid = sessionId(res)

    const quote = await QuoteModel.findOne({ _id: req.params.id, sessionId: sid })
    if (!quote) return res.status(404).json({ error: 'Quote not found.' })
    const rfq = await RfqModel.findOne({ _id: quote.rfqId, sessionId: sid })
    const supplier = await SupplierModel.findOne({ _id: quote.supplierId, sessionId: sid })
    if (!rfq || !supplier) return res.status(404).json({ error: 'Related RFQ or supplier not found.' })

    const message = await draftFollowUp(apiKey, rfq.toObject(), supplier.toObject(), quote.parsed ?? {})
    res.json({ message })
  }),
)
