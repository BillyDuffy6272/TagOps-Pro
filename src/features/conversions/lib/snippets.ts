import type { ConversionEventWithContainer } from '../types'

// Generates the copy-paste tracking code for a conversion event. Two flavours:
// the direct gtag.js call Google Ads' own setup flow hands out, and the
// dataLayer push used on sites where GTM owns the page (the custom-event
// trigger + conversion tag then live in the container).
//
// Every value here ends up pasted onto a real customer website, so nothing is
// trusted: jsStringLiteral() escapes anything used as a JS string (quotes,
// backslashes, newlines) instead of interpolating it raw, and commentSafe()
// strips line breaks from anything landing inside a `//` comment so it can't
// break out of the comment into executable code.

function jsStringLiteral(value: string): string {
  const escaped = value
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\r\n|\r|\n/g, '\\n')
  return `'${escaped}'`
}

function commentSafe(value: string): string {
  return value.replace(/[\r\n]+/g, ' ')
}

export function gtagConversionSnippet(event: ConversionEventWithContainer): string {
  const adsId = event.containerGoogleAdsConversionId
  const label = event.conversion_label
  const sendTo = adsId && label ? `${adsId}/${label}` : 'AW-CONVERSION_ID/CONVERSION_LABEL'

  const lines = [`  'send_to': ${jsStringLiteral(sendTo)}`]
  if (event.value_param) {
    lines.push(`  'value': 0, // TODO: set to the ${commentSafe(event.value_param)} amount`)
    lines.push(`  'currency': ${jsStringLiteral(event.currency ?? 'AUD')}`)
  }

  return [
    `// ${commentSafe(event.display_name || event.event_name)} — Google Ads conversion`,
    `gtag('event', 'conversion', {`,
    lines.join(',\n'),
    `});`,
  ].join('\n')
}

export function dataLayerConversionSnippet(event: ConversionEventWithContainer): string {
  const lines = [`  'event': ${jsStringLiteral(event.event_name)}`]
  if (event.value_param) {
    lines.push(`  ${jsStringLiteral(event.value_param)}: 0, // TODO: set to the numeric value`)
    lines.push(`  'currency': ${jsStringLiteral(event.currency ?? 'AUD')}`)
  }

  return [
    `// ${commentSafe(event.display_name || event.event_name)} — dataLayer event for GTM`,
    `window.dataLayer = window.dataLayer || [];`,
    `window.dataLayer.push({`,
    lines.join(',\n'),
    `});`,
  ].join('\n')
}
