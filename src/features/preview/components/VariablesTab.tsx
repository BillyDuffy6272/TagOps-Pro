import { variableLabel, type GtmVariable } from '../../../lib/gtm'
import { resolveVariable } from '../lib/simulator'

interface Props {
  variables: GtmVariable[]
  dataLayer: Record<string, unknown>
}

function formatValue(value: unknown): string {
  if (typeof value === 'string') return `"${value}"`
  return JSON.stringify(value)
}

// Mirrors GTM's own Variables output tab — name/type on the left, resolved
// return type and value on the right, for whatever data layer state applies.
export default function VariablesTab({ variables, dataLayer }: Props) {
  const rows = variables.map(variable => resolveVariable(variable, dataLayer))

  return (
    <div className="overflow-hidden rounded-lg border border-border-subtle bg-surface-sunken">
      <div className="border-b border-border-subtle px-4 py-2.5 text-[10.5px] font-semibold tracking-[0.07em] text-text-faint uppercase">
        Variables ({rows.length})
      </div>
      {rows.length === 0 ? (
        <div className="px-4 py-3 text-[12.5px] text-text-faint">This container has no variables.</div>
      ) : (
        rows.map(row => (
          <div key={row.variable.variableId} className="flex items-center justify-between gap-3 border-t border-border-subtle px-4 py-2.5 first:border-t-0">
            <div className="min-w-0">
              <div className="truncate font-mono text-[12.5px] font-semibold text-text-primary">{`{{${row.variable.name}}}`}</div>
              <div className="text-[11px] text-text-tertiary">{variableLabel(row.variable.type)}</div>
            </div>
            <div className="shrink-0 text-right">
              <div className="font-mono text-[10px] tracking-wide text-text-faint uppercase">
                {row.resolved ? typeof row.value : 'undefined'}
              </div>
              {row.resolved ? (
                <div className="font-mono text-[12px] text-text-secondary">{formatValue(row.value)}</div>
              ) : (
                <div className="text-[11px] text-text-faint italic">Not resolved in simulation</div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
