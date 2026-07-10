import type { ConversionEventWithContainer } from '../types'
import StatusDot from '../../../components/StatusDot'

interface Props {
  event: ConversionEventWithContainer
  onEdit: () => void
  onDelete: () => void
}

export default function ConversionCard({ event, onEdit, onDelete }: Props) {
  return (
    <div
      className={`flex min-w-0 flex-col gap-2.5 rounded-lg border border-border bg-surface p-4 transition-[border-color,box-shadow] duration-150 ease-out hover:border-white/12 hover:shadow-lg hover:shadow-black/30 ${event.is_active ? '' : 'opacity-55'}`}
    >
      <div className="flex items-center gap-2">
        <StatusDot active={event.is_active} title={event.is_active ? 'Active' : 'Inactive'} />
        {event.currency && (
          <span className="rounded-md border border-border bg-surface-sunken px-1.5 py-0.5 font-mono text-[11px] tracking-wide text-accent">
            {event.currency}
          </span>
        )}
      </div>

      <h3 className="m-0 wrap-anywhere font-mono text-[13.5px] leading-snug font-semibold text-text-primary">{event.event_name}</h3>
      {event.display_name && <p className="m-0 wrap-anywhere text-xs text-text-secondary">{event.display_name}</p>}

      {event.value_param && (
        <p className="m-0 wrap-anywhere text-xs text-text-tertiary">
          Value param: <code className="font-mono text-[11.5px] text-accent">{event.value_param}</code>
        </p>
      )}

      {event.notes && <p className="m-0 wrap-anywhere text-xs leading-relaxed text-text-tertiary">{event.notes}</p>}

      <div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-2.5">
        <span className="text-[11px] font-medium text-text-faint">{event.containerName}</span>
        <div className="flex shrink-0 gap-3">
          <button
            type="button"
            className="p-0 text-[11.5px] font-medium text-text-tertiary transition-colors duration-150 ease-out hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            onClick={onEdit}
          >
            Edit
          </button>
          <button
            type="button"
            className="p-0 text-[11.5px] font-medium text-text-tertiary transition-colors duration-150 ease-out hover:text-danger-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            onClick={onDelete}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}
