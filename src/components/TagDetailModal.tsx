import { tagLabel, tagCategory, triggerLabel, formatParameterValue, type GtmTag, type GtmTrigger } from '../lib/gtm'
import './TagDetailModal.css'

interface Props {
  tag: GtmTag
  firingTriggers: GtmTrigger[]
  blockingTriggers: GtmTrigger[]
  onClose: () => void
}

export default function TagDetailModal({ tag, firingTriggers, blockingTriggers, onClose }: Props) {
  const isActive = !tag.paused
  const category = tagCategory(tag.type)
  const label = tagLabel(tag.type)

  const htmlParam = tag.parameter?.find(p => p.key === 'html')
  const otherParams = (tag.parameter ?? []).filter(p => p.key && p.key !== 'html')

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel tag-detail-panel" onClick={e => e.stopPropagation()}>
        <header className="modal-header">
          <h2>{tag.name}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </header>

        <div className="modal-body">
          <section className="detail-section">
            <h3 className="detail-section-title">Tag Configuration</h3>

            <div className="detail-row">
              <span className="detail-label">Tag Type</span>
              <span className={`type-badge cat-${category}`}>{label}</span>
            </div>

            <div className="detail-row">
              <span className="detail-label">Status</span>
              <span className={`status-text ${isActive ? 'text-active' : 'text-paused'}`}>
                {isActive ? 'Active' : 'Paused'}
              </span>
            </div>

            {htmlParam?.value && (
              <div className="detail-block">
                <span className="detail-label">HTML</span>
                <pre className="code-block"><code>{htmlParam.value}</code></pre>
              </div>
            )}

            {otherParams.length > 0 && (
              <div className="detail-block">
                <span className="detail-label">Parameters</span>
                <div className="param-list">
                  {otherParams.map((p, i) => (
                    <div key={`${p.key}-${i}`} className="param-row">
                      <span className="param-key">{p.key}</span>
                      <span className="param-value">{formatParameterValue(p) || '—'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tag.notes && (
              <div className="detail-block">
                <span className="detail-label">Notes</span>
                <p className="detail-notes">{tag.notes}</p>
              </div>
            )}
          </section>

          <section className="detail-section">
            <h3 className="detail-section-title">Triggering</h3>

            <div className="detail-block">
              <span className="detail-label">Firing Triggers</span>
              {firingTriggers.length === 0 ? (
                <p className="detail-empty">No firing triggers.</p>
              ) : (
                <div className="trigger-ref-list">
                  {firingTriggers.map(t => (
                    <div key={t.triggerId} className="trigger-ref">
                      <span className="trigger-ref-dot trigger-ref-fires" />
                      <span className="trigger-ref-name">{t.name}</span>
                      <span className="trigger-ref-type">{triggerLabel(t.type)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {blockingTriggers.length > 0 && (
              <div className="detail-block">
                <span className="detail-label">Blocking Triggers</span>
                <div className="trigger-ref-list">
                  {blockingTriggers.map(t => (
                    <div key={t.triggerId} className="trigger-ref">
                      <span className="trigger-ref-dot trigger-ref-blocks" />
                      <span className="trigger-ref-name">{t.name}</span>
                      <span className="trigger-ref-type">{triggerLabel(t.type)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
