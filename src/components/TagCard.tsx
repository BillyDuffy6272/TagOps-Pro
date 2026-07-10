import { tagLabel, tagCategory, type GtmTag } from '../lib/gtm'
import StatusDot from './StatusDot'
import { tagBadgeClass } from './badgeStyles'

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
      className={`flex min-w-0 cursor-pointer flex-col gap-2.5 rounded-lg border border-border bg-surface p-4 transition-[border-color,box-shadow] duration-150 ease-out hover:border-white/12 hover:shadow-lg hover:shadow-black/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${isActive ? '' : 'opacity-55'}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick() } }}
    >
      <div className="flex items-center gap-2">
        <StatusDot active={isActive} title={isActive ? 'Active' : 'Paused'} />
        <span className={tagBadgeClass(category)}>{label}</span>
      </div>

      <h3 className="m-0 wrap-anywhere text-[13.5px] leading-snug font-semibold text-text-primary">{tag.name}</h3>

      {tag.notes && <p className="m-0 wrap-anywhere text-xs leading-relaxed text-text-tertiary">{tag.notes}</p>}

      <div className="mt-auto flex items-center justify-between border-t border-border pt-2.5">
        <span className={`text-[11px] font-semibold tracking-wide uppercase ${isActive ? 'text-success' : 'text-warning'}`}>
          {isActive ? 'Active' : 'Paused'}
        </span>
        <span className="font-mono text-[11px] font-medium tabular-nums text-text-faint">ID {tag.tagId}</span>
      </div>
    </div>
  )
}
