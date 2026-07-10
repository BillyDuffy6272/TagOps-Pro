type Tone = 'default' | 'success' | 'warning'

interface Stat {
  value: number
  label: string
  tone?: Tone
}

interface Props {
  stats: Stat[]
}

const TONE_CLASSES: Record<Tone, string> = {
  default: 'text-text-primary',
  success: 'text-success',
  warning: 'text-warning',
}

export default function StatRow({ stats }: Props) {
  return (
    <div className="flex flex-wrap items-center rounded-md border border-border-subtle bg-surface-sunken/70 px-3 py-2.5">
      {stats.map(stat => (
        <div key={stat.label} className="flex items-baseline gap-1.5 border-r border-border-subtle pr-4 pl-4 first:pl-0 last:border-r-0">
          <span className={`font-mono text-[14px] leading-none font-semibold tabular-nums ${TONE_CLASSES[stat.tone ?? 'default']}`}>
            {stat.value}
          </span>
          <span className="text-[12.5px] text-text-tertiary">{stat.label}</span>
        </div>
      ))}
    </div>
  )
}
