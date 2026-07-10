import { variableLabel, variableCategory, type GtmVariable } from '../../../lib/gtm'
import { variableBadgeClass } from '../../../components/badgeStyles'

interface Props {
  variable: GtmVariable
  usedByTags: { tagId: string; name: string }[]
}

export default function VariableCard({ variable, usedByTags }: Props) {
  const category = variableCategory(variable.type)
  const label = variableLabel(variable.type)

  return (
    <div className="flex min-w-0 flex-col gap-2.5 rounded-lg border border-border bg-surface p-4 transition-[border-color,box-shadow] duration-150 ease-out hover:border-white/12 hover:shadow-lg hover:shadow-black/30">
      <div className="flex items-center gap-2">
        <span className={variableBadgeClass(category)}>{label}</span>
      </div>

      <h3 className="m-0 wrap-anywhere font-mono text-[13.5px] leading-snug font-semibold text-text-primary">{`{{${variable.name}}}`}</h3>

      {variable.notes && <p className="m-0 wrap-anywhere text-xs leading-relaxed text-text-tertiary">{variable.notes}</p>}

      {usedByTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {usedByTags.map(tag => (
            <span
              key={tag.tagId}
              className="max-w-full overflow-hidden rounded-md border border-success/18 bg-success/8 px-1.5 py-0.5 text-[10.5px] text-ellipsis whitespace-nowrap text-green-300"
            >
              {tag.name}
            </span>
          ))}
        </div>
      )}

      <div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-2.5">
        <span className="text-[11px] font-medium text-text-tertiary">
          {usedByTags.length === 0 ? 'Not referenced by any tag' : `Used by ${usedByTags.length} tag${usedByTags.length === 1 ? '' : 's'}`}
        </span>
        <span className="font-mono text-[11px] font-medium tabular-nums text-text-faint">ID {variable.variableId}</span>
      </div>
    </div>
  )
}
