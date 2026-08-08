import { tagLabel } from '../../../lib/gtm'
import type { TagSummary } from '../lib/simulator'

interface Props {
  summary: TagSummary[]
  eventCount: number
}

function SummaryRow({ item }: { item: TagSummary }) {
  const { tag, fireCount, lastResult } = item
  return (
    <div className="flex items-start justify-between gap-3 border-t border-border-subtle px-4 py-3 first:border-t-0">
      <div className="min-w-0">
        <div className="truncate text-[13px] font-semibold text-text-primary">{tag.name}</div>
        <div className="text-[11.5px] text-text-tertiary">{tagLabel(tag.type)}</div>
        {fireCount === 0 && (
          <div className="mt-0.5 text-[11.5px] text-text-faint">{lastResult.reason}</div>
        )}
      </div>
      <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10.5px] font-semibold tracking-wide uppercase ${fireCount > 0 ? 'bg-success/10 text-success' : 'bg-white/5 text-text-faint'}`}>
        {fireCount > 0 ? `Fired ${fireCount}×` : 'Not fired'}
      </span>
    </div>
  )
}

// Right-hand panel for the pinned "Summary" timeline entry: fire counts
// rolled up across every simulated event so far, not just the selected one.
export default function SummaryPanel({ summary, eventCount }: Props) {
  const fired = summary.filter(s => s.fireCount > 0)
  const notFired = summary.filter(s => s.fireCount === 0)

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div>
        <h2 className="m-0 text-[15px] font-semibold text-text-primary">Summary</h2>
        <div className="text-[11.5px] text-text-faint">Across {eventCount} simulated event{eventCount === 1 ? '' : 's'} in this session</div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border-subtle bg-surface-sunken">
        <div className="border-b border-border-subtle px-4 py-2.5 text-[10.5px] font-semibold tracking-[0.07em] text-success uppercase">
          Tags fired ({fired.length})
        </div>
        {fired.length === 0 ? (
          <div className="px-4 py-3 text-[12.5px] text-text-faint">No tags have fired yet.</div>
        ) : (
          fired.map(item => <SummaryRow key={item.tag.tagId} item={item} />)
        )}
      </div>

      <div className="overflow-hidden rounded-lg border border-border-subtle bg-surface-sunken">
        <div className="border-b border-border-subtle px-4 py-2.5 text-[10.5px] font-semibold tracking-[0.07em] text-text-faint uppercase">
          Tags not fired ({notFired.length})
        </div>
        {notFired.length === 0 ? (
          <div className="px-4 py-3 text-[12.5px] text-text-faint">Every tag has fired at least once.</div>
        ) : (
          notFired.map(item => <SummaryRow key={item.tag.tagId} item={item} />)
        )}
      </div>
    </div>
  )
}
