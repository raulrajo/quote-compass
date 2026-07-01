import { Schema, model, Types, InferSchemaType } from 'mongoose'

/**
 * The structured fields an LLM extracts from a raw supplier quote message.
 * Every field is optional because real quotes are messy and incomplete — the
 * extraction confidence tells us how much to trust it.
 */
const parsedSchema = new Schema(
  {
    unitPrice: { type: Number },
    currency: { type: String, trim: true },
    quantity: { type: Number },
    totalPrice: { type: Number },
    leadTimeDays: { type: Number },
    moq: { type: Number }, // minimum order quantity
    paymentTerms: { type: String, trim: true },
    validUntil: { type: String, trim: true },
    notes: { type: String, trim: true },
  },
  { _id: false },
)

/** A single supplier's quote for a given RFQ. */
const quoteSchema = new Schema(
  {
    sessionId: { type: String, required: true, index: true },
    rfqId: { type: Types.ObjectId, ref: 'Rfq', required: true, index: true },
    supplierId: { type: Types.ObjectId, ref: 'Supplier', required: true },
    // The original message the supplier sent (email/chat text), kept verbatim.
    rawText: { type: String, required: true },
    parsed: { type: parsedSchema, default: {} },
    // 0..1 self-reported confidence from the extraction step.
    extractionConfidence: { type: Number, min: 0, max: 1 },
    extractionNotes: { type: String, trim: true },
  },
  { timestamps: true },
)

export type Quote = InferSchemaType<typeof quoteSchema>
export const QuoteModel = model('Quote', quoteSchema)
