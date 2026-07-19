import { useState } from 'react'
import { tagLabel } from '../../../lib/gtm'
import { eventLabel, type SimStep, type TagResult, type TagStatus } from '../lib/simulator'

interface Props {
  step: SimStep
}

type Tab = 'tags' | 'datalayer'

const STATUS_BADGE: Record<TagStatus, { label: string; classes: string }> = {
  fired: { label: 'Fired', classes: 'bg-success/10 text-success' },
  'not-fired': { label: 'Not fired', classes: 'bg-white/5 text-text-faint' },
  paused: { label: 'Paused', classes: 'bg-warning/10 text-warning' },
  blocked: { label: 'Blocked', classes: 'bg-danger/10 text-danger-text' },
}

function TagResultRow({ result }: { result: TagResult }) {
  const badge = STATUS_BADGE[result.status]
  return (
    <div className="flex items-start justify-between gap-3 border-t border-border-subtle px-4 py-3 first:border-t-0">
      <div className="min-w-0">
        <div className="truncate text-[13px] font-semibold text-text-primary">{result.tag.name}</div>
        <div className="text-[11.5px] text-text-tertiary">{tagLabel(result.tag.type)}</div>
        <div className="mt-0.5 text-[11.5px] text-text-faint">
          {result.reason}
          {result.unevaluatedConditions > 0 && (
            <span className="text-warning"> · {result.unevaluatedConditions} trigger condition{result.unevaluatedConditions === 1 ? '' : 's'} not evaluated in simulation</span>
          )}
        </div>
      </div>
      <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10.5px] font-semibold tracking-wide uppercase ${badge.classes}`}>
        {badge.label}
      </span>
    </div>
  )
}

// Right-hand panel of the preview screen: what happened on the selected event.
export default function TagResultsPanel({ step }: Props) {
  const [tab, setTab] = useState<Tab>('tags')

  const fired = step.results.filter(r => r.status === 'fired')
  const notFired = step.results.filter(r => r.status !== 'fired')

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="m-0 text-[15px] font-semibold text-text-primary">{eventLabel(step.event.name)}</h2>
          <div className="font-mono text-[11.5px] text-text-faint">{step.event.name}</div>
        </div>
        <div className="flex gap-1.5">
          {(['tags', 'datalayer'] as const).map(t => (
            <button
              key={t}
              type="button"
              className={`rounded-md px-3 py-1.5 text-[12.5px] font-semibold transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                tab === t ? 'bg-accent-muted text-accent' : 'text-text-tertiary hover:bg-white/5 hover:text-text-secondary'
              }`}
              onClick={() => setTab(t)}
            >
              {t === 'tags' ? `Tags (${fired.length}/${step.results.length})` : 'Data Layer'}
            </button>
          ))}
        </div>
      </div>

      {tab === 'tags' ? (
        <>
          <div className="overflow-hidden rounded-lg border border-border-subtle bg-surface-sunken">
            <div className="border-b border-border-subtle px-4 py-2.5 text-[10.5px] font-semibold tracking-[0.07em] text-success uppercase">
              Tags fired ({fired.length})
            </div>
            {fired.length === 0 ? (
              <div className="px-4 py-3 text-[12.5px] text-text-faint">No tags fired on this event.</div>
            ) : (
              fired.map(r => <TagResultRow key={r.tag.tagId} result={r} />)
            )}
          </div>

          <div className="overflow-hidden rounded-lg border border-border-subtle bg-surface-sunken">
            <div className="border-b border-border-subtle px-4 py-2.5 text-[10.5px] font-semibold tracking-[0.07em] text-text-faint uppercase">
              Tags not fired ({notFired.length})
            </div>
            {notFired.length === 0 ? (
              <div className="px-4 py-3 text-[12.5px] text-text-faint">Every tag fired on this event.</div>
            ) : (
              notFired.map(r => <TagResultRow key={r.tag.tagId} result={r} />)
            )}
          </div>
        </>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border-subtle bg-surface-sunken">
          <div className="border-b border-border-subtle px-4 py-2.5 text-[10.5px] font-semibold tracking-[0.07em] text-text-faint uppercase">
            Data layer after this event
          </div>
          <pre className="m-0 overflow-x-auto p-4 font-mono text-[12px] leading-relaxed text-text-secondary">
            {JSON.stringify(step.dataLayer, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
