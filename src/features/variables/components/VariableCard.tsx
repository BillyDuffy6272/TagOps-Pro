import { variableLabel, variableCategory, type GtmVariable } from '../../../lib/gtm'
import CategoryBadge from '../../../components/CategoryBadge'
import EntityRow from '../../../components/EntityRow'

interface Props {
  variable: GtmVariable
  usedByTags: { tagId: string; name: string }[]
}

export default function VariableCard({ variable, usedByTags }: Props) {
  const category = variableCategory(variable.type)
  const label = variableLabel(variable.type)

  return (
    <EntityRow
      title={`{{${variable.name}}}`}
      titleMono
      badge={<CategoryBadge kind="variable" category={category} label={label} />}
      meta={
        <>
          <span className={`rounded-md px-1.5 py-0.5 text-[11px] font-medium ${usedByTags.length === 0 ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'}`}>
            {usedByTags.length === 0 ? 'Unused' : `${usedByTags.length} tag${usedByTags.length === 1 ? '' : 's'}`}
          </span>
          <span className="font-mono text-[11px] font-medium tabular-nums text-text-faint">VAR-{variable.variableId}</span>
        </>
      }
      details={[
        ...(variable.notes ? [{ label: 'Notes', value: variable.notes }] : []),
      ]}
      associations={usedByTags.length > 0 && usedByTags.map(tag => (
          <span
            key={tag.tagId}
            className="max-w-full overflow-hidden rounded-md border border-border bg-white/4 px-1.5 py-0.5 text-[10.5px] text-ellipsis whitespace-nowrap text-text-secondary"
          >
            {tag.name}
          </span>
      ))}
    />
  )
}
