import { tagLabel, tagCategory, triggerLabel, formatParameterValue, formatCondition, type GtmTag, type GtmTrigger } from '../../../lib/gtm'
import { resolveTriggers, tagFiredSteps, eventLabel, type SimStep } from '../lib/simulator'
import Modal from '../../../components/Modal'
import CategoryBadge from '../../../components/CategoryBadge'

interface Props {
  tag: GtmTag
  steps: SimStep[]
  triggers: GtmTrigger[]
  onClose: () => void
}

const DETAIL_LABEL = 'text-[10.5px] font-semibold tracking-[0.07em] text-text-tertiary uppercase'

function TriggerRow({ trigger, tone }: { trigger: GtmTrigger; tone: 'fires' | 'blocks' }) {
  const conditions = [...(trigger.filter ?? []), ...(trigger.autoEventFilter ?? [])]
  return (
    <div className="flex flex-col gap-1.5 rounded-md border border-border bg-surface px-3 py-2">
      <div className="flex items-center gap-2">
        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${tone === 'fires' ? 'bg-success shadow-[0_0_0_2px_rgba(34,197,94,0.15)]' : 'bg-danger shadow-[0_0_0_2px_rgba(239,68,68,0.15)]'}`} />
        <span className="flex-1 wrap-anywhere text-[13px] font-semibold text-text-primary">{trigger.name}</span>
        <span className="text-[11px] whitespace-nowrap text-text-tertiary">{triggerLabel(trigger.type)}</span>
      </div>
      {conditions.length > 0 && (
        <div className="flex flex-col gap-1 pl-3.5">
          {conditions.map((c, i) => (
            <span key={i} className="wrap-anywhere font-mono text-[11px] text-text-tertiary">{formatCondition(c)}</span>
          ))}
        </div>
      )}
    </div>
  )
}

// Drilldown from a tag row in the preview's Summary or per-event panels —
// mirrors GTM's own "Tag Details" flyout (Properties, where it fired, and
// its firing/blocking triggers).
export default function PreviewTagDetailModal({ tag, steps, triggers, onClose }: Props) {
  const category = tagCategory(tag.type)
  const label = tagLabel(tag.type)

  const htmlParam = tag.parameter?.find(p => p.key === 'html')
  const otherParams = (tag.parameter ?? []).filter(p => p.key && p.key !== 'html')

  const firedSteps = tagFiredSteps(steps, tag.tagId)
  const firingTriggers = resolveTriggers(tag.firingTriggerId, triggers)
  const blockingTriggers = resolveTriggers(tag.blockingTriggerId, triggers)

  return (
    <Modal title={tag.name} onClose={onClose} maxWidth={640}>
      <section className="flex flex-col gap-3">
        <h3 className="m-0 text-xs font-semibold tracking-[0.06em] text-text-primary uppercase">Tag Details</h3>

        <div className="flex items-center justify-between">
          <span className={DETAIL_LABEL}>Tag Type</span>
          <CategoryBadge kind="tag" category={category} label={label} />
        </div>

        {htmlParam?.value && (
          <div className="flex flex-col gap-1.5">
            <span className={DETAIL_LABEL}>HTML</span>
            <pre className="m-0 overflow-x-auto rounded-md border border-border bg-surface p-3 font-mono text-xs leading-relaxed whitespace-pre text-sky-300">
              <code>{htmlParam.value}</code>
            </pre>
          </div>
        )}

        {otherParams.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <span className={DETAIL_LABEL}>Properties</span>
            <div className="flex flex-col gap-1.5 rounded-md border border-border bg-surface px-3 py-2.5">
              {otherParams.map((p, i) => (
                <div key={`${p.key}-${i}`} className="flex justify-between gap-3 text-xs">
                  <span className="shrink-0 font-mono text-text-tertiary">{p.key}</span>
                  <span className="wrap-anywhere text-right font-mono text-text-primary">{formatParameterValue(p) || '—'}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3 border-t border-border pt-5">
        <h3 className="m-0 text-xs font-semibold tracking-[0.06em] text-text-primary uppercase">Messages Where This Tag Fired</h3>
        {firedSteps.length === 0 ? (
          <p className="m-0 text-[12.5px] text-text-tertiary">Has not fired yet in this session.</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {firedSteps.map(step => (
              <div key={step.event.id} className="flex items-center gap-2.5 rounded-md border border-border bg-surface px-3 py-2">
                <span className="w-5 shrink-0 text-right font-mono text-[11px] text-text-faint">{steps.indexOf(step) + 1}</span>
                <span className="flex-1 text-[13px] font-semibold text-text-primary">{eventLabel(step.event.name)}</span>
                <span className="font-mono text-[11px] text-text-faint">{step.event.name}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3 border-t border-border pt-5">
        <h3 className="m-0 text-xs font-semibold tracking-[0.06em] text-text-primary uppercase">Triggering</h3>

        <div className="flex flex-col gap-1.5">
          <span className={DETAIL_LABEL}>Firing Triggers</span>
          {firingTriggers.length === 0 ? (
            <p className="m-0 text-[12.5px] text-text-tertiary">No firing triggers.</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {firingTriggers.map(t => <TriggerRow key={t.triggerId} trigger={t} tone="fires" />)}
            </div>
          )}
        </div>

        {blockingTriggers.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <span className={DETAIL_LABEL}>Blocking Triggers</span>
            <div className="flex flex-col gap-1.5">
              {blockingTriggers.map(t => <TriggerRow key={t.triggerId} trigger={t} tone="blocks" />)}
            </div>
          </div>
        )}
      </section>
    </Modal>
  )
}
