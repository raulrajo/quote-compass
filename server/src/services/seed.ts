import { RfqModel } from '../models/Rfq.js'
import { SupplierModel } from '../models/Supplier.js'
import { QuoteModel } from '../models/Quote.js'

/**
 * Load a realistic sample dataset into one session. Quotes are stored with their
 * structured `parsed` fields already filled in, so a visitor sees the comparison
 * immediately — the AI actions (re-parse, recommend, draft) then use their own key.
 */
export async function seedSession(sessionId: string): Promise<void> {
  await clearSession(sessionId)

  const [acme, shenzhen, euro] = await SupplierModel.create([
    { sessionId, name: 'Acme Machining', contactName: 'Dana Reyes', location: 'Ohio, USA' },
    { sessionId, name: 'Shenzhen Precision Works', contactName: 'Li Wei', location: 'Shenzhen, CN' },
    { sessionId, name: 'EuroCNC GmbH', contactName: 'Markus Braun', location: 'Stuttgart, DE' },
  ])

  const bracket = await RfqModel.create({
    sessionId,
    title: 'CNC aluminum mounting bracket',
    partName: 'Mounting bracket rev C',
    material: '6061-T6 aluminum',
    process: 'CNC machining',
    quantity: 500,
    unit: 'pcs',
    tolerances: '±0.05 mm on mounting holes',
    targetLeadTimeDays: 21,
    notes: 'Anodized (clear). Drawing supplied. Repeat order likely if quality holds.',
  })

  await QuoteModel.create([
    {
      sessionId,
      rfqId: bracket._id,
      supplierId: acme._id,
      rawText:
        'Hi — thanks for the drawing. For 500 pcs of the 6061 bracket we can do $4.20/ea, ' +
        'tooling already covered. Lead time about 3 weeks. Min order 100. Net 30 terms. Quote valid 30 days.',
      parsed: {
        unitPrice: 4.2,
        currency: 'USD',
        quantity: 500,
        totalPrice: 2100,
        leadTimeDays: 21,
        moq: 100,
        paymentTerms: 'Net 30',
        validUntil: null,
        notes: 'Tooling covered.',
      },
      extractionConfidence: 0.9,
    },
    {
      sessionId,
      rfqId: bracket._id,
      supplierId: shenzhen._id,
      rawText:
        'Dear customer, price for bracket USD 3.70 each at qty 500, MOQ 250 pcs. ' +
        'Production 30-35 days plus shipping ~10 days. 50% deposit, balance before shipment.',
      parsed: {
        unitPrice: 3.7,
        currency: 'USD',
        quantity: 500,
        totalPrice: 1850,
        leadTimeDays: 42,
        moq: 250,
        paymentTerms: '50% deposit, balance before shipment',
        validUntil: null,
        notes: 'Includes ~10 days shipping.',
      },
      extractionConfidence: 0.85,
    },
    {
      sessionId,
      rfqId: bracket._id,
      supplierId: euro._id,
      rawText:
        'Guten Tag. 500 Stück, 4,05 USD/Stück. Vorlaufzeit 2 Wochen ab Freigabe. ' +
        'Mindestbestellung 500. Zahlung Netto 14 Tage. Angebot 21 Tage gültig.',
      parsed: {
        unitPrice: 4.05,
        currency: 'USD',
        quantity: 500,
        totalPrice: 2025,
        leadTimeDays: 14,
        moq: 500,
        paymentTerms: 'Net 14',
        validUntil: null,
        notes: 'Fastest lead time.',
      },
      extractionConfidence: 0.88,
    },
  ])
}

export async function clearSession(sessionId: string): Promise<void> {
  await Promise.all([
    RfqModel.deleteMany({ sessionId }),
    SupplierModel.deleteMany({ sessionId }),
    QuoteModel.deleteMany({ sessionId }),
  ])
}
