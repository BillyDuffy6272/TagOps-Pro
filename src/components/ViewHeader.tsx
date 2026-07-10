import type { ReactNode } from 'react'

interface Props {
  title: string
  subtitle?: string
  action?: ReactNode
}

export default function ViewHeader({ title, subtitle, action }: Props) {
  return (
    <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="m-0 mb-1 text-[22px] font-semibold tracking-[-0.02em] text-text-primary">{title}</h1>
        {subtitle && <p className="m-0 text-xs text-text-tertiary">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  )
}
