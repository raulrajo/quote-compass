import { Schema, model, InferSchemaType } from 'mongoose'

/** A manufacturer/vendor that can be asked to quote on RFQs. */
const supplierSchema = new Schema(
  {
    sessionId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    contactName: { type: String, trim: true },
    email: { type: String, trim: true },
    location: { type: String, trim: true },
    notes: { type: String, trim: true },
  },
  { timestamps: true },
)

export type Supplier = InferSchemaType<typeof supplierSchema>
export const SupplierModel = model('Supplier', supplierSchema)
