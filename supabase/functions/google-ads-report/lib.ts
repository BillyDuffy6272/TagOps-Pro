// Pure helpers, kept separate from index.ts's Deno.serve handler so they
// can be unit-tested from tests/unit (Vitest, running under Node, can't
// import a file that touches Deno.serve/Deno.env at module scope).

export function buildConversionActionGaql(): string {
  // Last 30 days, one row per conversion action — matches the categories
  // conversion_events.category already uses (support.google.com/google-ads/answer/9791434).
  return [
    'SELECT',
    '  conversion_action.name,',
    '  metrics.conversions,',
    '  metrics.conversions_value',
    'FROM conversion_action',
    'WHERE segments.date DURING LAST_30_DAYS',
  ].join('\n')
}

export interface GoogleAdsConversionActionStat {
  conversionActionName: string
  conversions: number
  conversionsValue: number
}

interface GoogleAdsSearchRow {
  conversionAction?: { name?: string }
  metrics?: { conversions?: string | number; conversionsValue?: string | number }
}

// The Ads API's REST search response nests fields deeply and returns
// numeric metrics as strings (protobuf int64/double over JSON) — this is
// the one place that shape gets flattened into what the UI actually renders.
export function parseConversionActionStats(rows: GoogleAdsSearchRow[]): GoogleAdsConversionActionStat[] {
  return rows
    .filter(row => row.conversionAction?.name)
    .map(row => ({
      conversionActionName: row.conversionAction!.name!,
      conversions: Number(row.metrics?.conversions ?? 0),
      conversionsValue: Number(row.metrics?.conversionsValue ?? 0),
    }))
}

const CUSTOMER_ID_PATTERN = /^[0-9]{10}$/

export function isValidGoogleAdsCustomerId(value: string): boolean {
  return CUSTOMER_ID_PATTERN.test(value)
}
