import type { ReactNode } from 'react'

interface Props {
  title: string
  subtitle?: string
  action?: ReactNode
}

export default function ViewHeader({ title, subtitle, action }: Props) {
  return (
    <header className="mb-7 flex flex-wrap items-start justify-between gap-4 border-b border-border-subtle pb-5">
      <div>
        <h1 className="m-0 mb-1 text-[21px] font-semibold text-text-primary">{title}</h1>
        {subtitle && <p className="m-0 text-[13px] text-text-tertiary">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  )
}
