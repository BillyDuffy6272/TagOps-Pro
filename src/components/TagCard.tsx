import { tagLabel, tagCategory, type GtmTag } from '../lib/gtm'
import './TagCard.css'

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
      className={`tag-card ${isActive ? '' : 'tag-paused'}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick() } }}
    >
      <div className="tag-card-header">
        <span className={`status-dot ${isActive ? 'dot-active' : 'dot-paused'}`} title={isActive ? 'Active' : 'Paused'} />
        <span className={`type-badge cat-${category}`}>{label}</span>
      </div>

      <h3 className="tag-name">{tag.name}</h3>

      {tag.notes && <p className="tag-notes">{tag.notes}</p>}

      <div className="tag-footer">
        <span className={`status-text ${isActive ? 'text-active' : 'text-paused'}`}>
          {isActive ? 'Active' : 'Paused'}
        </span>
        <span className="tag-id">ID {tag.tagId}</span>
      </div>
    </div>
  )
}
