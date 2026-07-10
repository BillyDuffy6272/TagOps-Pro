import { tagLabel, tagCategory, type GtmTag } from '../lib/gtm'
import StatusDot from './StatusDot'
import CategoryBadge from './CategoryBadge'
import EntityRow from './EntityRow'

interface Props {
  tag: GtmTag
  onClick: () => void
}

export default function TagCard({ tag, onClick }: Props) {
  const isActive = !tag.paused
  const category = tagCategory(tag.type)
  const label = tagLabel(tag.type)

  return (
    <EntityRow
      title={tag.name}
      leading={<StatusDot active={isActive} title={isActive ? 'Active' : 'Paused'} />}
      badge={<CategoryBadge kind="tag" category={category} label={label} />}
      meta={
        <>
          <span className={`rounded-md px-1.5 py-0.5 text-[11px] font-semibold tracking-wide uppercase ${isActive ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
            {isActive ? 'Active' : 'Paused'}
          </span>
          <span className="font-mono text-[11px] font-medium tabular-nums text-text-faint">TAG-{tag.tagId}</span>
        </>
      }
      details={[
        ...(tag.notes ? [{ label: 'Notes', value: tag.notes }] : []),
      ]}
      muted={!isActive}
      interactive
      onClick={onClick}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick() } }}
    />
  )
}
