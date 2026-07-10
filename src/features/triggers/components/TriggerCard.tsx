import { triggerLabel, triggerCategory, triggerEventName, type GtmTrigger, type TagUsage } from '../../../lib/gtm'
import CategoryBadge from '../../../components/CategoryBadge'

interface Props {
  trigger: GtmTrigger
  usedByTags: TagUsage[]
}

export default function TriggerCard({ trigger, usedByTags }: Props) {
  const category = triggerCategory(trigger.type)
  const label = triggerLabel(trigger.type)
  const eventName = triggerEventName(trigger)

  return (
    <div className="grid min-w-0 grid-cols-1 gap-x-4 gap-y-2 border-b border-border-subtle px-4 py-3 transition-colors duration-150 ease-out last:border-b-0 hover:bg-white/5 sm:grid-cols-[1fr_auto]">
      <div className="flex min-w-0 items-center gap-2">
        <CategoryBadge kind="trigger" category={category} label={label} />
        <h3 className="m-0 min-w-0 truncate text-[13.5px] leading-snug font-semibold text-text-primary">{trigger.name}</h3>
      </div>

      <div className="flex items-center justify-end gap-3">
        <span className="text-[11px] font-medium text-text-tertiary">
          {usedByTags.length === 0 ? 'Unused' : `${usedByTags.length} tag${usedByTags.length === 1 ? '' : 's'}`}
        </span>
        <span className="font-mono text-[11px] font-medium tabular-nums text-text-faint">TRG-{trigger.triggerId}</span>
      </div>

      <div className="flex min-w-0 flex-wrap items-center gap-2 sm:col-span-2">
        {eventName && (
          <p className="m-0 truncate text-xs text-text-tertiary">
            Event <code className="font-mono text-[11.5px] text-accent">{eventName}</code>
          </p>
        )}
        {trigger.notes && <p className="m-0 min-w-[180px] flex-1 truncate text-xs leading-relaxed text-text-tertiary">{trigger.notes}</p>}
        {usedByTags.length > 0 && usedByTags.map((usage, i) => (
            <span
              key={`${usage.tagId}-${usage.relationship}-${i}`}
              className="inline-flex max-w-full items-center gap-1.5 overflow-hidden rounded-md border border-border bg-white/4 px-1.5 py-0.5 text-[10.5px] text-ellipsis whitespace-nowrap text-text-secondary"
            >
              <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${usage.relationship === 'blocks' ? 'bg-danger' : 'bg-success'}`} aria-hidden="true" />
              {usage.relationship === 'blocks' ? 'blocks' : 'fires'} {usage.name}
            </span>
        ))}
      </div>
    </div>
  )
}
