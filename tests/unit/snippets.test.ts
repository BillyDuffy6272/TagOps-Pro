import { describe, expect, it } from 'vitest'
import { dataLayerConversionSnippet, gtagConversionSnippet } from '../../src/features/conversions/lib/snippets'
import type { ConversionEventWithContainer } from '../../src/features/conversions/types'

function makeEvent(overrides: Partial<ConversionEventWithContainer>): ConversionEventWithContainer {
  return {
    id: 'e1',
    display_id: 'CONID_XX_1234',
    organisation_id: 'org1',
    container_id: 'c1',
    event_name: 'purchase',
    display_name: 'Purchase',
    value_param: null,
    currency: 'AUD',
    is_active: true,
    category: 'purchase',
    conversion_label: null,
    notes: null,
    created_at: '2026-07-01T00:00:00Z',
    updated_at: '2026-07-01T00:00:00Z',
    deleted_at: null,
    created_by: null,
    containerName: 'Main site',
    containerGoogleAdsConversionId: null,
    ...overrides,
  } as ConversionEventWithContainer
}

describe('gtagConversionSnippet', () => {
  it('builds a real send_to when the container and event are linked', () => {
    const snippet = gtagConversionSnippet(
      makeEvent({ containerGoogleAdsConversionId: 'AW-123456789', conversion_label: 'AbC-D_efG' })
    )
    expect(snippet).toContain(`'send_to': 'AW-123456789/AbC-D_efG'`)
    expect(snippet).toContain(`gtag('event', 'conversion',`)
  })

  it('falls back to placeholders when Google Ads is not linked', () => {
    const snippet = gtagConversionSnippet(makeEvent({}))
    expect(snippet).toContain('AW-CONVERSION_ID/CONVERSION_LABEL')
  })

  it('includes value and currency only when a value parameter is set', () => {
    expect(gtagConversionSnippet(makeEvent({}))).not.toContain('currency')
    const withValue = gtagConversionSnippet(makeEvent({ value_param: 'purchase_value' }))
    expect(withValue).toContain(`'value'`)
    expect(withValue).toContain(`'currency': 'AUD'`)
    expect(withValue).toContain('purchase_value')
  })
})

describe('dataLayerConversionSnippet', () => {
  it('pushes the event name and guards dataLayer initialisation', () => {
    const snippet = dataLayerConversionSnippet(makeEvent({}))
    expect(snippet).toContain('window.dataLayer = window.dataLayer || [];')
    expect(snippet).toContain(`'event': 'purchase'`)
  })

  it('includes the value parameter under its own key', () => {
    const snippet = dataLayerConversionSnippet(makeEvent({ value_param: 'purchase_value' }))
    expect(snippet).toContain(`'purchase_value': 0,`)
  })
})
