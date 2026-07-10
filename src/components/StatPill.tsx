type Tone = 'default' | 'success' | 'warning'

interface Props {
  value: number
  label: string
  tone?: Tone
}

const TONE_CLASSES: Record<Tone, string> = {
  default: 'text-text-primary',
  success: 'text-success',
  warning: 'text-warning',
}

export default function StatPill({ value, label, tone = 'default' }: Props) {
  return (
    <div className="min-w-[76px] rounded-lg border border-border bg-surface px-5 py-3">
      <span className={`block font-mono text-2xl leading-none font-bold tracking-[-0.02em] tabular-nums ${TONE_CLASSES[tone]}`}>
        {value}
      </span>
      <span className="mt-1.5 block text-[10px] font-semibold tracking-[0.07em] text-text-tertiary uppercase">
        {label}
      </span>
    </div>
  )
}
