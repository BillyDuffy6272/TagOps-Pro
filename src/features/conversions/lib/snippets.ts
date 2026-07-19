import type { ConversionEventWithContainer } from '../types'

// Generates the copy-paste tracking code for a conversion event. Two flavours:
// the direct gtag.js call Google Ads' own setup flow hands out, and the
// dataLayer push used on sites where GTM owns the page (the custom-event
// trigger + conversion tag then live in the container).

export function gtagConversionSnippet(event: ConversionEventWithContainer): string {
  const adsId = event.containerGoogleAdsConversionId
  const label = event.conversion_label
  const sendTo = adsId && label ? `${adsId}/${label}` : 'AW-CONVERSION_ID/CONVERSION_LABEL'

  const lines = [`  'send_to': '${sendTo}'`]
  if (event.value_param) {
    lines.push(`  'value': 0, // TODO: set to the ${event.value_param} amount`)
    lines.push(`  'currency': '${event.currency ?? 'AUD'}'`)
  }

  return [
    `// ${event.display_name || event.event_name} — Google Ads conversion`,
    `gtag('event', 'conversion', {`,
    lines.join(',\n'),
    `});`,
  ].join('\n')
}

export function dataLayerConversionSnippet(event: ConversionEventWithContainer): string {
  const lines = [`  'event': '${event.event_name}'`]
  if (event.value_param) {
    lines.push(`  '${event.value_param}': 0, // TODO: set to the numeric value`)
    lines.push(`  'currency': '${event.currency ?? 'AUD'}'`)
  }

  return [
    `// ${event.display_name || event.event_name} — dataLayer event for GTM`,
    `window.dataLayer = window.dataLayer || [];`,
    `window.dataLayer.push({`,
    lines.join(',\n'),
    `});`,
  ].join('\n')
}
