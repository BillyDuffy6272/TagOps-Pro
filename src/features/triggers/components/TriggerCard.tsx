import { triggerLabel, triggerCategory, triggerEventName, type GtmTrigger, type TagUsage } from '../../../lib/gtm'
import CategoryBadge from '../../../components/CategoryBadge'
import EntityRow from '../../../components/EntityRow'

interface Props {
  trigger: GtmTrigger
  usedByTags: TagUsage[]
}

export default function TriggerCard({ trigger, usedByTags }: Props) {
  const category = triggerCategory(trigger.type)
  const label = triggerLabel(trigger.type)
  const eventName = triggerEventName(trigger)

  return (
    <EntityRow
      title={trigger.name}
      badge={<CategoryBadge kind="trigger" category={category} label={label} />}
      meta={
        <>
          <span className={`rounded-md px-1.5 py-0.5 text-[11px] font-medium ${usedByTags.length === 0 ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'}`}>
            {usedByTags.length === 0 ? 'Unused' : `${usedByTags.length} tag${usedByTags.length === 1 ? '' : 's'}`}
          </span>
          <span className="font-mono text-[11px] font-medium tabular-nums text-text-faint">TRG-{trigger.triggerId}</span>
        </>
      }
      details={[
        ...(eventName ? [{ label: 'Event', value: <code className="font-mono text-[11.5px] text-accent">{eventName}</code> }] : []),
        ...(trigger.notes ? [{ label: 'Notes', value: trigger.notes }] : []),
      ]}
      associations={usedByTags.length > 0 && usedByTags.map((usage, i) => (
        <span
          key={`${usage.tagId}-${usage.relationship}-${i}`}
          className="inline-flex max-w-full items-center gap-1.5 overflow-hidden rounded-md border border-border bg-white/4 px-1.5 py-0.5 text-[10.5px] text-ellipsis whitespace-nowrap text-text-secondary"
        >
          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${usage.relationship === 'blocks' ? 'bg-danger' : 'bg-success'}`} aria-hidden="true" />
          {usage.relationship === 'blocks' ? 'blocks' : 'fires'} {usage.name}
        </span>
      ))}
    />
  )
}
