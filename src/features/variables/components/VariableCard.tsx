import { VARIABLE_TYPE_LABELS, type VariableWithContainer } from '../types'
import './VariableCard.css'

interface Props {
  variable: VariableWithContainer
  onEdit: () => void
  onDelete: () => void
}

export default function VariableCard({ variable, onEdit, onDelete }: Props) {
  return (
    <div className="variable-card">
      <div className="variable-card-header">
        <span className="variable-type-badge">{VARIABLE_TYPE_LABELS[variable.variable_type]}</span>
      </div>

      <h3 className="variable-name">{variable.name}</h3>

      {variable.default_value && (
        <p className="variable-default">Default: <code>{variable.default_value}</code></p>
      )}

      {variable.notes && <p className="variable-notes">{variable.notes}</p>}

      <div className="variable-footer">
        <span className="variable-container">{variable.containerName}</span>
        <div className="variable-actions">
          <button className="variable-action-btn" onClick={onEdit}>Edit</button>
          <button className="variable-action-btn variable-action-danger" onClick={onDelete}>Delete</button>
        </div>
      </div>
    </div>
  )
}
