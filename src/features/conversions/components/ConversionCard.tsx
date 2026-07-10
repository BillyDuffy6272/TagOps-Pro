import type { ConversionEventWithContainer } from '../types'
import StatusDot from '../../../components/StatusDot'
import EntityRow from '../../../components/EntityRow'

interface Props {
  event: ConversionEventWithContainer
  onEdit: () => void
  onDelete: () => void
}

export default function ConversionCard({ event, onEdit, onDelete }: Props) {
  return (
    <EntityRow
      title={event.event_name}
      titleMono
      leading={<StatusDot active={event.is_active} title={event.is_active ? 'Active' : 'Inactive'} />}
      badge={event.currency && (
        <span className="rounded-md border border-border bg-surface-sunken px-1.5 py-0.5 font-mono text-[11px] tracking-wide text-accent">
          {event.currency}
        </span>
      )}
      meta={
        <>
          <span className={`rounded-md px-1.5 py-0.5 text-[11px] font-semibold tracking-wide uppercase ${event.is_active ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
            {event.is_active ? 'Active' : 'Inactive'}
          </span>
          <span className="max-w-[180px] truncate text-[11px] font-medium text-text-faint">{event.containerName}</span>
        </>
      }
      actions={
        <div className="flex shrink-0 gap-2 border-l border-border-subtle pl-2">
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
      }
      details={[
        ...(event.display_name ? [{ label: 'Name', value: event.display_name }] : []),
        ...(event.value_param ? [{ label: 'Value', value: <code className="font-mono text-[11.5px] text-accent">{event.value_param}</code> }] : []),
        ...(event.notes ? [{ label: 'Notes', value: event.notes }] : []),
      ]}
      muted={!event.is_active}
    />
  )
}
