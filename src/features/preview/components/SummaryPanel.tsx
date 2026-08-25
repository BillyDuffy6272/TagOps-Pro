import { useState } from 'react'
import { tagLabel, type GtmVariable } from '../../../lib/gtm'
import type { TagSummary } from '../lib/simulator'
import VariablesTab from './VariablesTab'
import DataLayerTab from './DataLayerTab'

interface Props {
  summary: TagSummary[]
  eventCount: number
  variables: GtmVariable[]
  dataLayer: Record<string, unknown>
  onSelectTag: (tag: TagSummary['tag']) => void
}

type Tab = 'tags' | 'variables' | 'datalayer'

function SummaryRow({ item, onSelect }: { item: TagSummary; onSelect: () => void }) {
  const { tag, fireCount, lastResult } = item
  return (
    <button
      type="button"
      className="flex w-full items-start justify-between gap-3 border-t border-border-subtle px-4 py-3 text-left transition-colors duration-150 ease-out first:border-t-0 hover:bg-overlay/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
      onClick={onSelect}
    >
      <div className="min-w-0">
        <div className="truncate text-[13px] font-semibold text-text-primary">{tag.name}</div>
        <div className="text-[11.5px] text-text-tertiary">{tagLabel(tag.type)}</div>
        {fireCount === 0 && (
          <div className="mt-0.5 text-[11.5px] text-text-faint">{lastResult.reason}</div>
        )}
      </div>
      <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10.5px] font-semibold tracking-wide uppercase ${fireCount > 0 ? 'bg-success/10 text-success' : 'bg-overlay/5 text-text-faint'}`}>
        {fireCount > 0 ? `Fired ${fireCount}×` : 'Not fired'}
      </span>
    </button>
  )
}

// Right-hand panel for the pinned "Summary" timeline entry: fire counts
// rolled up across every simulated event so far, not just the selected one.
export default function SummaryPanel({ summary, eventCount, variables, dataLayer, onSelectTag }: Props) {
  const [tab, setTab] = useState<Tab>('tags')

  const fired = summary.filter(s => s.fireCount > 0)
  const notFired = summary.filter(s => s.fireCount === 0)

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="m-0 text-[15px] font-semibold text-text-primary">Summary</h2>
          <div className="text-[11.5px] text-text-faint">Across {eventCount} simulated event{eventCount === 1 ? '' : 's'} in this session</div>
        </div>
        <div className="flex gap-1.5">
          {(['tags', 'variables', 'datalayer'] as const).map(t => (
            <button
              key={t}
              type="button"
              className={`rounded-md px-3 py-1.5 text-[12.5px] font-semibold transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                tab === t ? 'bg-accent-muted text-accent' : 'text-text-tertiary hover:bg-overlay/5 hover:text-text-secondary'
              }`}
              onClick={() => setTab(t)}
            >
              {t === 'tags' ? `Tags (${fired.length}/${summary.length})` : t === 'variables' ? 'Variables' : 'Data Layer'}
            </button>
          ))}
        </div>
      </div>

      {tab === 'tags' && (
        <>
          <div className="overflow-hidden rounded-lg border border-border-subtle bg-surface-sunken">
            <div className="border-b border-border-subtle px-4 py-2.5 text-[10.5px] font-semibold tracking-[0.07em] text-success uppercase">
              Tags fired ({fired.length})
            </div>
            {fired.length === 0 ? (
              <div className="px-4 py-3 text-[12.5px] text-text-faint">No tags have fired yet.</div>
            ) : (
              fired.map(item => <SummaryRow key={item.tag.tagId} item={item} onSelect={() => onSelectTag(item.tag)} />)
            )}
          </div>

          <div className="overflow-hidden rounded-lg border border-border-subtle bg-surface-sunken">
            <div className="border-b border-border-subtle px-4 py-2.5 text-[10.5px] font-semibold tracking-[0.07em] text-text-faint uppercase">
              Tags not fired ({notFired.length})
            </div>
            {notFired.length === 0 ? (
              <div className="px-4 py-3 text-[12.5px] text-text-faint">Every tag has fired at least once.</div>
            ) : (
              notFired.map(item => <SummaryRow key={item.tag.tagId} item={item} onSelect={() => onSelectTag(item.tag)} />)
            )}
          </div>
        </>
      )}

      {tab === 'variables' && <VariablesTab variables={variables} dataLayer={dataLayer} />}

      {tab === 'datalayer' && <DataLayerTab dataLayer={dataLayer} label="Current data layer state" />}
    </div>
  )
}
