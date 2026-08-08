import { variableLabel, variableCategory, formatParameterValue, type GtmVariable } from '../lib/gtm'
import Modal from './Modal'
import CategoryBadge from './CategoryBadge'

interface Props {
  variable: GtmVariable
  usedByTags: { tagId: string; name: string }[]
  onClose: () => void
}

const DETAIL_LABEL = 'text-[10.5px] font-semibold tracking-[0.07em] text-text-tertiary uppercase'

export default function VariableDetailModal({ variable, usedByTags, onClose }: Props) {
  const category = variableCategory(variable.type)
  const label = variableLabel(variable.type)
  const params = (variable.parameter ?? []).filter(p => p.key)

  return (
    <Modal title={`{{${variable.name}}}`} onClose={onClose} maxWidth={640}>
      <section className="flex flex-col gap-3">
        <h3 className="m-0 text-xs font-semibold tracking-[0.06em] text-text-primary uppercase">Variable Configuration</h3>

        <div className="flex items-center justify-between">
          <span className={DETAIL_LABEL}>Variable Type</span>
          <CategoryBadge kind="variable" category={category} label={label} />
        </div>

        {params.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <span className={DETAIL_LABEL}>Parameters</span>
            <div className="flex flex-col gap-1.5 rounded-md border border-border bg-surface px-3 py-2.5">
              {params.map((p, i) => (
                <div key={`${p.key}-${i}`} className="flex justify-between gap-3 text-xs">
                  <span className="shrink-0 font-mono text-text-tertiary">{p.key}</span>
                  <span className="wrap-anywhere text-right font-mono text-text-primary">{formatParameterValue(p) || '—'}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {variable.notes && (
          <div className="flex flex-col gap-1.5">
            <span className={DETAIL_LABEL}>Notes</span>
            <p className="m-0 wrap-anywhere text-[12.5px] leading-relaxed text-text-secondary">{variable.notes}</p>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3 border-t border-border pt-5">
        <h3 className="m-0 text-xs font-semibold tracking-[0.06em] text-text-primary uppercase">Usage</h3>

        <div className="flex flex-col gap-1.5">
          <span className={DETAIL_LABEL}>Used In Tags</span>
          {usedByTags.length === 0 ? (
            <p className="m-0 text-[12.5px] text-text-tertiary">Not used in any tag.</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {usedByTags.map(t => (
                <div key={t.tagId} className="flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-success shadow-[0_0_0_2px_rgba(34,197,94,0.15)]" />
                  <span className="flex-1 wrap-anywhere text-[13px] font-semibold text-text-primary">{t.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </Modal>
  )
}
