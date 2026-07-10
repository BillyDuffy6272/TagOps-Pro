import { triggerLabel, triggerCategory, triggerEventName, type GtmTrigger, type TagUsage } from '../../../lib/gtm'
import './TriggerCard.css'

interface Props {
  trigger: GtmTrigger
  usedByTags: TagUsage[]
}

export default function TriggerCard({ trigger, usedByTags }: Props) {
  const category = triggerCategory(trigger.type)
  const label = triggerLabel(trigger.type)
  const eventName = triggerEventName(trigger)

  return (
    <div className="trigger-card">
      <div className="trigger-card-header">
        <span className={`trigger-type-badge cat-${category}`}>{label}</span>
      </div>

      <h3 className="trigger-name">{trigger.name}</h3>

      {eventName && <p className="trigger-event-name">Event: <code>{eventName}</code></p>}

      {trigger.notes && <p className="trigger-notes">{trigger.notes}</p>}

      {usedByTags.length > 0 && (
        <div className="trigger-tags">
          {usedByTags.map((usage, i) => (
            <span key={`${usage.tagId}-${usage.relationship}-${i}`} className={`trigger-tag-chip chip-${usage.relationship}`}>
              {usage.relationship === 'blocks' ? 'blocks' : 'fires'} {usage.name}
            </span>
          ))}
        </div>
      )}

      <div className="trigger-footer">
        <span className="trigger-usage">
          {usedByTags.length === 0 ? 'Not used by any tag' : `Used by ${usedByTags.length} tag${usedByTags.length === 1 ? '' : 's'}`}
        </span>
        <span className="trigger-id">ID {trigger.triggerId}</span>
      </div>
    </div>
  )
}
