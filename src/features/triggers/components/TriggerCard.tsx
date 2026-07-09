import { TRIGGER_TYPE_LABELS, type TriggerWithTags } from '../types'
import './TriggerCard.css'

interface Props {
  trigger: TriggerWithTags
  onEdit: () => void
  onDelete: () => void
}

export default function TriggerCard({ trigger, onEdit, onDelete }: Props) {
  const conditionCount = Array.isArray(trigger.conditions) ? trigger.conditions.length : 0

  return (
    <div className="trigger-card">
      <div className="trigger-card-header">
        <span className="trigger-type-badge">{TRIGGER_TYPE_LABELS[trigger.trigger_type]}</span>
        {conditionCount > 0 && (
          <span className="trigger-condition-count">
            {conditionCount} condition{conditionCount === 1 ? '' : 's'}
          </span>
        )}
      </div>

      <h3 className="trigger-name">{trigger.name}</h3>

      {trigger.trigger_type === 'custom_event' && trigger.event_name && (
        <p className="trigger-event-name">Event: <code>{trigger.event_name}</code></p>
      )}

      {trigger.notes && <p className="trigger-notes">{trigger.notes}</p>}

      {trigger.tags.length > 0 && (
        <div className="trigger-tags">
          {trigger.tags.map((tag, i) => (
            <span key={`${tag.name}-${i}`} className={`trigger-tag-chip chip-${tag.relationship}`}>
              {tag.relationship === 'blocks' ? 'blocks' : 'fires'} {tag.name}
            </span>
          ))}
        </div>
      )}

      <div className="trigger-footer">
        <span className="trigger-container">{trigger.containerName}</span>
        <div className="trigger-actions">
          <button className="trigger-action-btn" onClick={onEdit}>Edit</button>
          <button className="trigger-action-btn trigger-action-danger" onClick={onDelete}>Delete</button>
        </div>
      </div>
    </div>
  )
}
