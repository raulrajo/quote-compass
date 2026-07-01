import { Schema, model, InferSchemaType } from 'mongoose'

/**
 * An RFQ (Request For Quote): the part an engineer needs made, plus the
 * requirements suppliers will quote against.
 */
const rfqSchema = new Schema(
  {
    // Scopes data to one browser session so public-demo visitors don't collide.
    sessionId: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true },
    partName: { type: String, trim: true },
    material: { type: String, trim: true },
    process: { type: String, trim: true }, // e.g. "CNC machining", "Injection molding"
    quantity: { type: Number, required: true, min: 1 },
    unit: { type: String, trim: true, default: 'pcs' },
    tolerances: { type: String, trim: true },
    targetLeadTimeDays: { type: Number, min: 0 },
    notes: { type: String, trim: true },
    status: { type: String, enum: ['open', 'closed'], default: 'open' },
  },
  { timestamps: true },
)

export type Rfq = InferSchemaType<typeof rfqSchema>
export const RfqModel = model('Rfq', rfqSchema)
