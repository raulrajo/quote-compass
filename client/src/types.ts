export interface Rfq {
  _id: string
  title: string
  partName?: string
  material?: string
  process?: string
  quantity: number
  unit?: string
  tolerances?: string
  targetLeadTimeDays?: number
  notes?: string
  status: 'open' | 'closed'
  createdAt: string
}

export interface Supplier {
  _id: string
  name: string
  contactName?: string
  email?: string
  location?: string
  notes?: string
}

export interface ParsedQuote {
  unitPrice?: number | null
  currency?: string | null
  quantity?: number | null
  totalPrice?: number | null
  leadTimeDays?: number | null
  moq?: number | null
  paymentTerms?: string | null
  validUntil?: string | null
  notes?: string | null
}

export interface Quote {
  _id: string
  rfqId: string
  supplierId: Supplier // populated on read
  rawText: string
  parsed: ParsedQuote
  extractionConfidence?: number
  extractionNotes?: string
  createdAt: string
}

export interface QuoteScore {
  quoteId: string
  score: number
  pros: string[]
  cons: string[]
}

export interface Recommendation {
  recommendedQuoteId: string | null
  headline: string
  reasoning: string
  scores: QuoteScore[]
}
