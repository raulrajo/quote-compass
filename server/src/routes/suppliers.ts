import { Router } from 'express'
import { z } from 'zod'
import { SupplierModel } from '../models/Supplier.js'
import { asyncHandler } from '../middleware/errors.js'
import { sessionId } from '../middleware/context.js'

export const suppliersRouter = Router()

const SupplierInput = z.object({
  name: z.string().min(1),
  contactName: z.string().optional(),
  email: z.string().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
})

suppliersRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const suppliers = await SupplierModel.find({ sessionId: sessionId(res) }).sort({ createdAt: -1 })
    res.json(suppliers)
  }),
)

suppliersRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const data = SupplierInput.parse(req.body)
    const supplier = await SupplierModel.create({ ...data, sessionId: sessionId(res) })
    res.status(201).json(supplier)
  }),
)

suppliersRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await SupplierModel.deleteOne({ _id: req.params.id, sessionId: sessionId(res) })
    res.status(204).end()
  }),
)
