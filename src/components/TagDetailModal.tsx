import { tagLabel, tagCategory, triggerLabel, formatParameterValue, type GtmTag, type GtmTrigger } from '../lib/gtm'
import Modal from './Modal'
import { tagBadgeClass } from './badgeStyles'

interface Props {
  tag: GtmTag
  firingTriggers: GtmTrigger[]
  blockingTriggers: GtmTrigger[]
  onClose: () => void
}

const DETAIL_LABEL = 'text-[10.5px] font-semibold tracking-[0.07em] text-text-tertiary uppercase'

export default function TagDetailModal({ tag, firingTriggers, blockingTriggers, onClose }: Props) {
  const isActive = !tag.paused
  const category = tagCategory(tag.type)
  const label = tagLabel(tag.type)

  const htmlParam = tag.parameter?.find(p => p.key === 'html')
  const otherParams = (tag.parameter ?? []).filter(p => p.key && p.key !== 'html')

  return (
    <Modal title={tag.name} onClose={onClose} maxWidth={640}>
      <section className="flex flex-col gap-3">
        <h3 className="m-0 text-xs font-semibold tracking-[0.06em] text-text-primary uppercase">Tag Configuration</h3>

        <div className="flex items-center justify-between">
          <span className={DETAIL_LABEL}>Tag Type</span>
          <span className={tagBadgeClass(category)}>{label}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className={DETAIL_LABEL}>Status</span>
          <span className={`text-[11px] font-semibold tracking-wide uppercase ${isActive ? 'text-success' : 'text-warning'}`}>
            {isActive ? 'Active' : 'Paused'}
          </span>
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
            <span className={DETAIL_LABEL}>Parameters</span>
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

        {tag.notes && (
          <div className="flex flex-col gap-1.5">
            <span className={DETAIL_LABEL}>Notes</span>
            <p className="m-0 wrap-anywhere text-[12.5px] leading-relaxed text-text-secondary">{tag.notes}</p>
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
              {firingTriggers.map(t => (
                <div key={t.triggerId} className="flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-success shadow-[0_0_0_2px_rgba(34,197,94,0.15)]" />
                  <span className="flex-1 wrap-anywhere text-[13px] font-semibold text-text-primary">{t.name}</span>
                  <span className="text-[11px] whitespace-nowrap text-text-tertiary">{triggerLabel(t.type)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {blockingTriggers.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <span className={DETAIL_LABEL}>Blocking Triggers</span>
            <div className="flex flex-col gap-1.5">
              {blockingTriggers.map(t => (
                <div key={t.triggerId} className="flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-danger shadow-[0_0_0_2px_rgba(239,68,68,0.15)]" />
                  <span className="flex-1 wrap-anywhere text-[13px] font-semibold text-text-primary">{t.name}</span>
                  <span className="text-[11px] whitespace-nowrap text-text-tertiary">{triggerLabel(t.type)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </Modal>
  )
}
