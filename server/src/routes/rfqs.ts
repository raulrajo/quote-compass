import { Router } from 'express'
import { z } from 'zod'
import { RfqModel } from '../models/Rfq.js'
import { QuoteModel } from '../models/Quote.js'
import { SupplierModel } from '../models/Supplier.js'
import { asyncHandler } from '../middleware/errors.js'
import { requireLlmKey, sessionId } from '../middleware/context.js'
import { recommend, type QuoteForRanking } from '../services/quoteAI.js'

export const rfqsRouter = Router()

const RfqInput = z.object({
  title: z.string().min(1),
  partName: z.string().optional(),
  material: z.string().optional(),
  process: z.string().optional(),
  quantity: z.number().int().positive(),
  unit: z.string().optional(),
  tolerances: z.string().optional(),
  targetLeadTimeDays: z.number().int().nonnegative().optional(),
  notes: z.string().optional(),
})

rfqsRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const rfqs = await RfqModel.find({ sessionId: sessionId(res) }).sort({ createdAt: -1 })
    res.json(rfqs)
  }),
)

rfqsRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const data = RfqInput.parse(req.body)
    const rfq = await RfqModel.create({ ...data, sessionId: sessionId(res) })
    res.status(201).json(rfq)
  }),
)

rfqsRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const rfq = await RfqModel.findOne({ _id: req.params.id, sessionId: sessionId(res) })
    if (!rfq) return res.status(404).json({ error: 'RFQ not found.' })
    res.json(rfq)
  }),
)

rfqsRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const sid = sessionId(res)
    await RfqModel.deleteOne({ _id: req.params.id, sessionId: sid })
    await QuoteModel.deleteMany({ rfqId: req.params.id, sessionId: sid })
    res.status(204).end()
  }),
)

/** AI: rank every quote for this RFQ and recommend the best one. */
rfqsRouter.post(
  '/:id/recommend',
  asyncHandler(async (req, res) => {
    const apiKey = requireLlmKey(req)
    const sid = sessionId(res)

    const rfq = await RfqModel.findOne({ _id: req.params.id, sessionId: sid })
    if (!rfq) return res.status(404).json({ error: 'RFQ not found.' })

    const quotes = await QuoteModel.find({ rfqId: rfq._id, sessionId: sid })
    if (quotes.length === 0) {
      return res.status(400).json({ error: 'Add at least one quote before asking for a recommendation.' })
    }

    const suppliers = await SupplierModel.find({ sessionId: sid })
    const nameById = new Map(suppliers.map((s) => [String(s._id), s.name]))

    const forRanking: QuoteForRanking[] = quotes.map((q) => ({
      id: String(q._id),
      supplierName: nameById.get(String(q.supplierId)) ?? 'Unknown supplier',
      parsed: q.parsed ?? {},
    }))

    const recommendation = await recommend(apiKey, rfq.toObject(), forRanking)
    res.json(recommendation)
  }),
)
