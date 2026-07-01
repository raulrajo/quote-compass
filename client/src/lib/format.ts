export function money(value?: number | null, currency?: string | null): string {
  if (value == null) return '—'
  const symbol = currency && currency.length <= 3 ? `${currency} ` : (currency ?? '')
  return `${symbol}${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
}

export function days(value?: number | null): string {
  return value == null ? '—' : `${value} d`
}

export function num(value?: number | null): string {
  return value == null ? '—' : value.toLocaleString()
}

export function text(value?: string | null): string {
  return value == null || value === '' ? '—' : value
}
