import { variableLabel, variableCategory, type GtmVariable } from '../../../lib/gtm'
import './VariableCard.css'

interface Props {
  variable: GtmVariable
  usedByTags: { tagId: string; name: string }[]
}

export default function VariableCard({ variable, usedByTags }: Props) {
  const category = variableCategory(variable.type)
  const label = variableLabel(variable.type)

  return (
    <div className="variable-card">
      <div className="variable-card-header">
        <span className={`variable-type-badge cat-${category}`}>{label}</span>
      </div>

      <h3 className="variable-name">{`{{${variable.name}}}`}</h3>

      {variable.notes && <p className="variable-notes">{variable.notes}</p>}

      {usedByTags.length > 0 && (
        <div className="variable-tags">
          {usedByTags.map(tag => (
            <span key={tag.tagId} className="variable-tag-chip">{tag.name}</span>
          ))}
        </div>
      )}

      <div className="variable-footer">
        <span className="variable-usage">
          {usedByTags.length === 0 ? 'Not referenced by any tag' : `Used by ${usedByTags.length} tag${usedByTags.length === 1 ? '' : 's'}`}
        </span>
        <span className="variable-id">ID {variable.variableId}</span>
      </div>
    </div>
  )
}
