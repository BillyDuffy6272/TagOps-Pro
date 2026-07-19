import { useState } from 'react'
import type { ConversionEventWithContainer } from '../types'

interface Props {
  event: ConversionEventWithContainer
  onEdit: () => void
  onDelete: () => void
  onSnippet: () => void
}

function GoogleAdsIdBadge({ conversionId, label }: { conversionId: string; label: string }) {
  const [copied, setCopied] = useState(false)
  const full = `${conversionId}/${label}`
  const truncatedLabel = label.length > 10 ? `${label.slice(0, 10)}…` : label

  async function handleCopy() {
    await navigator.clipboard.writeText(full)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <button
      type="button"
      title={copied ? 'Copied!' : `Copy ${full}`}
      onClick={handleCopy}
      className="rounded-md border border-border bg-surface-sunken px-1.5 py-0.5 font-mono text-[11px] tracking-wide text-text-tertiary transition-colors duration-150 ease-out hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      {copied ? 'Copied!' : `${conversionId}/${truncatedLabel}`}
    </button>
  )
}

export default function ConversionTableRow({ event, onEdit, onDelete, onSnippet }: Props) {
  return (
    <tr className={`border-t border-border-subtle transition-colors duration-150 ease-out hover:bg-white/5 ${event.is_active ? '' : 'opacity-55'}`}>
      <td className="px-4 py-3 align-top">
        <div className="text-[13px] font-semibold text-text-primary">{event.display_name || event.event_name}</div>
        <div className="font-mono text-[11.5px] text-text-faint">{event.event_name}</div>
        {event.notes && <div className="mt-1 max-w-[280px] truncate text-[11.5px] text-text-tertiary">{event.notes}</div>}
      </td>
      <td className="px-4 py-3 align-top">
        {event.containerGoogleAdsConversionId && event.conversion_label ? (
          <GoogleAdsIdBadge conversionId={event.containerGoogleAdsConversionId} label={event.conversion_label} />
        ) : (
          <span className="text-[11.5px] text-text-faint">Not linked</span>
        )}
      </td>
      <td className="px-4 py-3 align-top">
        {event.value_param ? (
          <span className="flex items-center gap-1.5">
            <code className="font-mono text-[11.5px] text-accent">{event.value_param}</code>
            {event.currency && (
              <span className="rounded-md border border-border bg-surface-sunken px-1.5 py-0.5 font-mono text-[10.5px] tracking-wide text-text-tertiary">
                {event.currency}
              </span>
            )}
          </span>
        ) : (
          <span className="text-[11.5px] text-text-faint">—</span>
        )}
      </td>
      <td className="px-4 py-3 align-top">
        <span className={`rounded-md px-1.5 py-0.5 text-[11px] font-semibold tracking-wide uppercase ${event.is_active ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
          {event.is_active ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td className="px-4 py-3 text-right align-top">
        <div className="flex justify-end gap-2">
          <button
            type="button"
            className="rounded px-1.5 py-0.5 text-[11.5px] font-medium text-text-tertiary transition-colors duration-150 ease-out hover:bg-white/6 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            onClick={onSnippet}
          >
            Code
          </button>
          <button
            type="button"
            className="rounded px-1.5 py-0.5 text-[11.5px] font-medium text-text-tertiary transition-colors duration-150 ease-out hover:bg-white/6 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            onClick={onEdit}
          >
            Edit
          </button>
          <button
            type="button"
            className="rounded px-1.5 py-0.5 text-[11.5px] font-medium text-text-tertiary transition-colors duration-150 ease-out hover:bg-white/6 hover:text-danger-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            onClick={onDelete}
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  )
}
