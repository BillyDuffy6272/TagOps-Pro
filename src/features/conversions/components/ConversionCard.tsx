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
      className={`grid min-w-0 grid-cols-1 gap-x-4 gap-y-2 border-b border-border-subtle px-4 py-3 transition-colors duration-150 ease-out last:border-b-0 hover:bg-white/5 sm:grid-cols-[1fr_auto] ${event.is_active ? '' : 'opacity-55'}`}
    >
      <div className="flex min-w-0 items-center gap-2">
        <StatusDot active={event.is_active} title={event.is_active ? 'Active' : 'Inactive'} />
        {event.currency && (
          <span className="rounded-md border border-border bg-surface-sunken px-1.5 py-0.5 font-mono text-[11px] tracking-wide text-accent">
            {event.currency}
          </span>
        )}
        <h3 className="m-0 min-w-0 truncate font-mono text-[13.5px] leading-snug font-semibold text-text-primary">{event.event_name}</h3>
      </div>

      <div className="flex items-center justify-end gap-3">
        <span className="max-w-[180px] truncate text-[11px] font-medium text-text-faint">{event.containerName}</span>
        <div className="flex shrink-0 gap-2">
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
      </div>

      <div className="flex min-w-0 flex-wrap items-center gap-2 sm:col-span-2">
        {event.display_name && <p className="m-0 truncate text-xs text-text-secondary">{event.display_name}</p>}
        {event.value_param && (
          <p className="m-0 truncate text-xs text-text-tertiary">
            Value <code className="font-mono text-[11.5px] text-accent">{event.value_param}</code>
          </p>
        )}
        {event.notes && <p className="m-0 min-w-[180px] flex-1 truncate text-xs leading-relaxed text-text-tertiary">{event.notes}</p>}
      </div>
    </div>
  )
}
