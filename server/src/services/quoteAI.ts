import { z } from 'zod'
import { completeStructured, completeText } from './llm.js'
import type { Rfq } from '../models/Rfq.js'
import type { Supplier } from '../models/Supplier.js'

/**
 * The multi-step LLM workflow at the heart of QuoteCompass:
 *   1. extractQuote   — messy supplier text  → structured, comparable fields
 *   2. recommend      — many quotes           → a ranked recommendation + reasoning
 *   3. draftFollowUp  — a chosen quote        → a polished follow-up message
 * Each step is a focused, single-purpose Claude call (BYO API key).
 */

// ---------------------------------------------------------------------------
// Step 1 — extraction
// ---------------------------------------------------------------------------

const ParsedQuoteSchema = z.object({
  unitPrice: z.number().nullable().describe('Price per unit as a number, no currency symbol'),
  currency: z.string().nullable().describe('ISO code or symbol, e.g. "USD", "EUR", "$"'),
  quantity: z.number().nullable().describe('Quantity the quote is priced for'),
  totalPrice: z.number().nullable().describe('Total price if stated'),
  leadTimeDays: z.number().nullable().describe('Lead time converted to calendar days'),
  moq: z.number().nullable().describe('Minimum order quantity'),
  paymentTerms: z.string().nullable().describe('e.g. "Net 30", "50% upfront"'),
  validUntil: z.string().nullable().describe('Quote expiry as an ISO date if stated'),
  notes: z.string().nullable().describe('Anything else notable: tooling fees, shipping, caveats'),
})

const ExtractionSchema = z.object({
  parsed: ParsedQuoteSchema,
  confidence: z.number().describe('0..1 — how confident you are in this extraction'),
  extractionNotes: z.string().nullable().describe('Short note on assumptions or ambiguity'),
})

export type Extraction = z.infer<typeof ExtractionSchema>

export function extractQuote(apiKey: string, rfq: Rfq, rawText: string): Promise<Extraction> {
  const system =
    'You extract structured data from raw manufacturing supplier quotes. ' +
    'Quotes are messy free text (emails, chat). Pull out the fields precisely. ' +
    'Convert lead times to calendar days (e.g. "3-4 weeks" -> 25). ' +
    'If a field is not present, return null — never guess. Report honest confidence.'

  const user =
    `RFQ context:\n${describeRfq(rfq)}\n\n` +
    `Supplier quote (verbatim):\n"""\n${rawText}\n"""\n\n` +
    'Extract the structured quote.'

  return completeStructured({ apiKey, system, user, schema: ExtractionSchema })
}

// ---------------------------------------------------------------------------
// Step 2 — recommendation across all quotes for an RFQ
// ---------------------------------------------------------------------------

const RecommendationSchema = z.object({
  recommendedQuoteId: z
    .string()
    .nullable()
    .describe('The id of the best overall quote, or null if none are viable'),
  headline: z.string().describe('One-sentence bottom line for a busy engineer'),
  reasoning: z.string().describe('2-4 sentences explaining the trade-offs behind the pick'),
  scores: z
    .array(
      z.object({
        quoteId: z.string(),
        score: z.number().describe('0..100 overall fit'),
        pros: z.array(z.string()),
        cons: z.array(z.string()),
      }),
    )
    .describe('One entry per quote provided'),
})

export type Recommendation = z.infer<typeof RecommendationSchema>

export interface QuoteForRanking {
  id: string
  supplierName: string
  parsed: Record<string, unknown>
}

export function recommend(
  apiKey: string,
  rfq: Rfq,
  quotes: QuoteForRanking[],
): Promise<Recommendation> {
  const system =
    'You are a sourcing analyst. Given an RFQ and competing supplier quotes, ' +
    'weigh unit price, total cost, lead time, MOQ and payment terms against the ' +
    "RFQ's quantity and target lead time. Recommend the best overall option and " +
    'explain the trade-offs plainly. Reward the quote that best fits the actual need, ' +
    'not merely the cheapest. Use each quote id ONLY to fill the recommendedQuoteId and ' +
    'quoteId fields; in all prose (headline, reasoning, pros, cons) refer to suppliers by ' +
    'name only — never mention or print an id.'

  const user =
    `RFQ:\n${describeRfq(rfq)}\n\n` +
    `Competing quotes (JSON):\n${JSON.stringify(quotes, null, 2)}\n\n` +
    'Score every quote and recommend one.'

  return completeStructured({ apiKey, system, user, schema: RecommendationSchema, maxTokens: 3072 })
}

// ---------------------------------------------------------------------------
// Step 3 — draft a follow-up message to a supplier
// ---------------------------------------------------------------------------

export function draftFollowUp(
  apiKey: string,
  rfq: Rfq,
  supplier: Supplier,
  parsed: Record<string, unknown>,
): Promise<string> {
  const system =
    'You draft concise, professional follow-up emails from an engineer to a ' +
    'manufacturing supplier. Be friendly and specific. Reference the quote details, ' +
    'ask any clarifying questions raised by gaps in the quote, and propose next steps. ' +
    'Return only the email body — no subject line, no placeholders like [Name].'

  const user =
    `RFQ:\n${describeRfq(rfq)}\n\n` +
    `Supplier: ${supplier.name}${supplier.contactName ? ` (contact: ${supplier.contactName})` : ''}\n` +
    `Their quote (structured):\n${JSON.stringify(parsed, null, 2)}\n\n` +
    'Write the follow-up email body.'

  return completeText({ apiKey, system, user })
}

// ---------------------------------------------------------------------------

function describeRfq(rfq: Rfq): string {
  const parts = [
    `Title: ${rfq.title}`,
    rfq.partName && `Part: ${rfq.partName}`,
    rfq.material && `Material: ${rfq.material}`,
    rfq.process && `Process: ${rfq.process}`,
    `Quantity: ${rfq.quantity} ${rfq.unit ?? 'pcs'}`,
    rfq.tolerances && `Tolerances: ${rfq.tolerances}`,
    rfq.targetLeadTimeDays != null && `Target lead time: ${rfq.targetLeadTimeDays} days`,
    rfq.notes && `Notes: ${rfq.notes}`,
  ].filter(Boolean)
  return parts.join('\n')
}
