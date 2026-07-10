import { triggerLabel, triggerCategory, triggerEventName, type GtmTrigger, type TagUsage } from '../../../lib/gtm'
import { triggerBadgeClass } from '../../../components/badgeStyles'

interface Props {
  trigger: GtmTrigger
  usedByTags: TagUsage[]
}

export default function TriggerCard({ trigger, usedByTags }: Props) {
  const category = triggerCategory(trigger.type)
  const label = triggerLabel(trigger.type)
  const eventName = triggerEventName(trigger)

  return (
    <div className="flex min-w-0 flex-col gap-2.5 rounded-lg border border-border bg-surface p-4 transition-[border-color,box-shadow] duration-150 ease-out hover:border-white/12 hover:shadow-lg hover:shadow-black/30">
      <div className="flex flex-wrap items-center gap-2">
        <span className={triggerBadgeClass(category)}>{label}</span>
      </div>

      <h3 className="m-0 wrap-anywhere text-[13.5px] leading-snug font-semibold text-text-primary">{trigger.name}</h3>

      {eventName && (
        <p className="m-0 wrap-anywhere text-xs text-text-tertiary">
          Event: <code className="font-mono text-[11.5px] text-accent">{eventName}</code>
        </p>
      )}

      {trigger.notes && <p className="m-0 wrap-anywhere text-xs leading-relaxed text-text-tertiary">{trigger.notes}</p>}

      {usedByTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {usedByTags.map((usage, i) => (
            <span
              key={`${usage.tagId}-${usage.relationship}-${i}`}
              className={`max-w-full overflow-hidden rounded-md px-1.5 py-0.5 text-[10.5px] text-ellipsis whitespace-nowrap ${
                usage.relationship === 'blocks'
                  ? 'border border-danger/18 bg-danger/8 text-red-300'
                  : 'border border-success/18 bg-success/8 text-green-300'
              }`}
            >
              {usage.relationship === 'blocks' ? 'blocks' : 'fires'} {usage.name}
            </span>
          ))}
        </div>
      )}

      <div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-2.5">
        <span className="text-[11px] font-medium text-text-tertiary">
          {usedByTags.length === 0 ? 'Not used by any tag' : `Used by ${usedByTags.length} tag${usedByTags.length === 1 ? '' : 's'}`}
        </span>
        <span className="font-mono text-[11px] font-medium tabular-nums text-text-faint">ID {trigger.triggerId}</span>
      </div>
    </div>
  )
}
