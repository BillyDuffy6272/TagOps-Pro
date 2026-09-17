import { describe, expect, it } from 'vitest'
import { isValidGoogleAdsCustomerId } from '../../src/features/conversions/api/googleAds'
import {
  buildConversionActionGaql,
  isValidGoogleAdsCustomerId as isValidGoogleAdsCustomerIdInFunction,
  parseConversionActionStats,
} from '../../supabase/functions/google-ads-report/lib'

// Only the pure, testable pieces of the Google Ads integration (ADR-0039).
// The live token-exchange and Ads API call in
// supabase/functions/google-ads-report/index.ts cannot be integration-tested
// without a real developer token — see docs/08-test-plan.md.

describe('isValidGoogleAdsCustomerId (client)', () => {
  it('accepts a plain 10-digit customer id', () => {
    expect(isValidGoogleAdsCustomerId('1234567890')).toBe(true)
  })

  it('accepts the dashed display format', () => {
    expect(isValidGoogleAdsCustomerId('123-456-7890')).toBe(true)
  })

  it('rejects anything that is not exactly 10 digits', () => {
    expect(isValidGoogleAdsCustomerId('123456789')).toBe(false)
    expect(isValidGoogleAdsCustomerId('12345678901')).toBe(false)
    expect(isValidGoogleAdsCustomerId('AW-123456789')).toBe(false)
    expect(isValidGoogleAdsCustomerId('')).toBe(false)
  })
})

describe('isValidGoogleAdsCustomerId (Edge Function)', () => {
  it('requires digits only, no dashes, on the server side', () => {
    expect(isValidGoogleAdsCustomerIdInFunction('1234567890')).toBe(true)
    expect(isValidGoogleAdsCustomerIdInFunction('123-456-7890')).toBe(false)
  })
})

describe('buildConversionActionGaql', () => {
  it('selects conversion action name and conversion metrics over the last 30 days', () => {
    const query = buildConversionActionGaql()
    expect(query).toContain('conversion_action.name')
    expect(query).toContain('metrics.conversions')
    expect(query).toContain('metrics.conversions_value')
    expect(query).toContain('LAST_30_DAYS')
  })
})

describe('parseConversionActionStats', () => {
  it('flattens the Ads API search response shape into flat stats', () => {
    const stats = parseConversionActionStats([
      { conversionAction: { name: 'Purchase' }, metrics: { conversions: '4', conversionsValue: '199.5' } },
    ])
    expect(stats).toEqual([{ conversionActionName: 'Purchase', conversions: 4, conversionsValue: 199.5 }])
  })

  it('defaults missing metrics to zero rather than throwing', () => {
    const stats = parseConversionActionStats([{ conversionAction: { name: 'Sign up' } }])
    expect(stats).toEqual([{ conversionActionName: 'Sign up', conversions: 0, conversionsValue: 0 }])
  })

  it('drops rows with no conversion action name', () => {
    const stats = parseConversionActionStats([{ metrics: { conversions: '1' } }])
    expect(stats).toEqual([])
  })
})
