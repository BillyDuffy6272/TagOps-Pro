import { tagLabel, tagCategory, type GtmTag } from '../lib/gtm'
import StatusDot from './StatusDot'
import CategoryBadge from './CategoryBadge'

interface Props {
  tag: GtmTag
  onClick: () => void
}

export default function TagCard({ tag, onClick }: Props) {
  const isActive = !tag.paused
  const category = tagCategory(tag.type)
  const label = tagLabel(tag.type)

  return (
    <div
      className={`grid min-w-0 cursor-pointer grid-cols-1 gap-x-4 gap-y-2 border-b border-border-subtle px-4 py-3 transition-colors duration-150 ease-out last:border-b-0 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:grid-cols-[1fr_auto] ${isActive ? '' : 'opacity-55'}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick() } }}
    >
      <div className="flex min-w-0 items-center gap-2">
        <StatusDot active={isActive} title={isActive ? 'Active' : 'Paused'} />
        <CategoryBadge kind="tag" category={category} label={label} />
        <h3 className="m-0 min-w-0 truncate text-[13.5px] leading-snug font-semibold text-text-primary">{tag.name}</h3>
      </div>

      <div className="flex items-center justify-end gap-3">
        <span className={`text-[11px] font-semibold tracking-wide uppercase ${isActive ? 'text-success' : 'text-warning'}`}>
          {isActive ? 'Active' : 'Paused'}
        </span>
        <span className="font-mono text-[11px] font-medium tabular-nums text-text-faint">TAG-{tag.tagId}</span>
      </div>

      {tag.notes && <p className="m-0 truncate text-xs leading-relaxed text-text-tertiary sm:col-span-2">{tag.notes}</p>}
    </div>
  )
}
