import { triggerLabel, triggerCategory, triggerEventName, formatCondition, type GtmTrigger, type TagUsage } from '../lib/gtm'
import Modal from './Modal'
import CategoryBadge from './CategoryBadge'

interface Props {
  trigger: GtmTrigger
  usedByTags: TagUsage[]
  onClose: () => void
}

const DETAIL_LABEL = 'text-[10.5px] font-semibold tracking-[0.07em] text-text-tertiary uppercase'

export default function TriggerDetailModal({ trigger, usedByTags, onClose }: Props) {
  const category = triggerCategory(trigger.type)
  const label = triggerLabel(trigger.type)
  const eventName = triggerEventName(trigger)

  const conditions = [...(trigger.filter ?? []), ...(trigger.autoEventFilter ?? [])]
  const firingTags = usedByTags.filter(u => u.relationship === 'fires_on')
  const blockingTags = usedByTags.filter(u => u.relationship === 'blocks')

  return (
    <Modal title={trigger.name} onClose={onClose} maxWidth={640}>
      <section className="flex flex-col gap-3">
        <h3 className="m-0 text-xs font-semibold tracking-[0.06em] text-text-primary uppercase">Trigger Configuration</h3>

        <div className="flex items-center justify-between">
          <span className={DETAIL_LABEL}>Trigger Type</span>
          <CategoryBadge kind="trigger" category={category} label={label} />
        </div>

        {eventName && (
          <div className="flex items-center justify-between gap-3">
            <span className={DETAIL_LABEL}>Event Name</span>
            <code className="wrap-anywhere font-mono text-[12.5px] text-accent">{eventName}</code>
          </div>
        )}

        {conditions.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <span className={DETAIL_LABEL}>Conditions</span>
            <div className="flex flex-col gap-1.5 rounded-md border border-border bg-surface px-3 py-2.5">
              {conditions.map((c, i) => (
                <div key={i} className="wrap-anywhere font-mono text-xs text-text-primary">{formatCondition(c)}</div>
              ))}
            </div>
          </div>
        )}

        {trigger.notes && (
          <div className="flex flex-col gap-1.5">
            <span className={DETAIL_LABEL}>Notes</span>
            <p className="m-0 wrap-anywhere text-[12.5px] leading-relaxed text-text-secondary">{trigger.notes}</p>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3 border-t border-border pt-5">
        <h3 className="m-0 text-xs font-semibold tracking-[0.06em] text-text-primary uppercase">Usage</h3>

        <div className="flex flex-col gap-1.5">
          <span className={DETAIL_LABEL}>Fires Tags</span>
          {firingTags.length === 0 ? (
            <p className="m-0 text-[12.5px] text-text-tertiary">No tags use this trigger to fire.</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {firingTags.map(t => (
                <div key={t.tagId} className="flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-success shadow-[0_0_0_2px_rgba(34,197,94,0.15)]" />
                  <span className="flex-1 wrap-anywhere text-[13px] font-semibold text-text-primary">{t.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {blockingTags.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <span className={DETAIL_LABEL}>Blocks Tags</span>
            <div className="flex flex-col gap-1.5">
              {blockingTags.map(t => (
                <div key={t.tagId} className="flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-danger shadow-[0_0_0_2px_rgba(239,68,68,0.15)]" />
                  <span className="flex-1 wrap-anywhere text-[13px] font-semibold text-text-primary">{t.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </Modal>
  )
}
