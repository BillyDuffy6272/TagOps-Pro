import { variableLabel, variableCategory, type GtmVariable } from '../../../lib/gtm'
import CategoryBadge from '../../../components/CategoryBadge'

interface Props {
  variable: GtmVariable
  usedByTags: { tagId: string; name: string }[]
}

export default function VariableCard({ variable, usedByTags }: Props) {
  const category = variableCategory(variable.type)
  const label = variableLabel(variable.type)

  return (
    <div className="grid min-w-0 grid-cols-1 gap-x-4 gap-y-2 border-b border-border-subtle px-4 py-3 transition-colors duration-150 ease-out last:border-b-0 hover:bg-white/5 sm:grid-cols-[1fr_auto]">
      <div className="flex min-w-0 items-center gap-2">
        <CategoryBadge kind="variable" category={category} label={label} />
        <h3 className="m-0 min-w-0 truncate font-mono text-[13.5px] leading-snug font-semibold text-text-primary">{`{{${variable.name}}}`}</h3>
      </div>

      <div className="flex items-center justify-end gap-3">
        <span className="text-[11px] font-medium text-text-tertiary">
          {usedByTags.length === 0 ? 'Unused' : `${usedByTags.length} tag${usedByTags.length === 1 ? '' : 's'}`}
        </span>
        <span className="font-mono text-[11px] font-medium tabular-nums text-text-faint">VAR-{variable.variableId}</span>
      </div>

      <div className="flex min-w-0 flex-wrap items-center gap-2 sm:col-span-2">
        {variable.notes && <p className="m-0 min-w-[180px] flex-1 truncate text-xs leading-relaxed text-text-tertiary">{variable.notes}</p>}
        {usedByTags.length > 0 && usedByTags.map(tag => (
          <span
            key={tag.tagId}
            className="max-w-full overflow-hidden rounded-md border border-border bg-white/4 px-1.5 py-0.5 text-[10.5px] text-ellipsis whitespace-nowrap text-text-secondary"
          >
            {tag.name}
          </span>
        ))}
      </div>
    </div>
  )
}
