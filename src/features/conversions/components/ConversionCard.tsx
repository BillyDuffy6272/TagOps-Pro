import type { ConversionEventWithContainer } from '../types'
import './ConversionCard.css'

interface Props {
  event: ConversionEventWithContainer
  onEdit: () => void
  onDelete: () => void
}

export default function ConversionCard({ event, onEdit, onDelete }: Props) {
  return (
    <div className={`conversion-card${event.is_active ? '' : ' conversion-inactive'}`}>
      <div className="conversion-card-header">
        <span className={`status-dot ${event.is_active ? 'dot-active' : 'dot-paused'}`} title={event.is_active ? 'Active' : 'Inactive'} />
        {event.currency && <span className="conversion-currency-badge">{event.currency}</span>}
      </div>

      <h3 className="conversion-event-name">{event.event_name}</h3>
      {event.display_name && <p className="conversion-display-name">{event.display_name}</p>}

      {event.value_param && (
        <p className="conversion-value-param">Value param: <code>{event.value_param}</code></p>
      )}

      {event.notes && <p className="conversion-notes">{event.notes}</p>}

      <div className="conversion-footer">
        <span className="conversion-container">{event.containerName}</span>
        <div className="conversion-actions">
          <button className="conversion-action-btn" onClick={onEdit}>Edit</button>
          <button className="conversion-action-btn conversion-action-danger" onClick={onDelete}>Delete</button>
        </div>
      </div>
    </div>
  )
}
