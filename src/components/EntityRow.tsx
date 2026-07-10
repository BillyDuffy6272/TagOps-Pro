import type { KeyboardEvent, ReactNode } from 'react'

interface Detail {
  label: string
  value: ReactNode
}

interface Props {
  title: ReactNode
  badge?: ReactNode
  leading?: ReactNode
  meta?: ReactNode
  details?: Detail[]
  associations?: ReactNode
  actions?: ReactNode
  muted?: boolean
  titleMono?: boolean
  interactive?: boolean
  onClick?: () => void
  onKeyDown?: (event: KeyboardEvent<HTMLDivElement>) => void
}

export default function EntityRow({
  title,
  badge,
  leading,
  meta,
  details = [],
  associations,
  actions,
  muted = false,
  titleMono = false,
  interactive = false,
  onClick,
  onKeyDown,
}: Props) {
  return (
    <div
      className={`grid min-w-0 grid-cols-1 gap-2 border-b border-border-subtle px-4 py-3.5 transition-colors duration-150 ease-out last:border-b-0 hover:bg-white/5 sm:grid-cols-[minmax(0,1fr)_auto] ${
        muted ? 'opacity-55' : ''
      } ${interactive ? 'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent' : ''}`}
      onClick={onClick}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={onKeyDown}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        {leading}
        {badge}
        <h3 className={`m-0 min-w-0 truncate text-[13.5px] leading-5 font-semibold text-text-primary ${titleMono ? 'font-mono' : ''}`}>
          {title}
        </h3>
      </div>

      <div className="flex min-w-0 items-center gap-2 sm:justify-end">
        {meta}
        {actions}
      </div>

      {(details.length > 0 || associations) && (
        <div className="flex min-w-0 flex-col gap-2 sm:col-span-2">
          {details.length > 0 && (
            <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1.5">
              {details.map(detail => (
                <div key={detail.label} className="flex min-w-0 items-baseline gap-1.5 text-xs">
                  <span className="shrink-0 font-medium text-text-faint">{detail.label}</span>
                  <span className="min-w-0 truncate text-text-tertiary">{detail.value}</span>
                </div>
              ))}
            </div>
          )}
          {associations && (
            <div className="flex min-w-0 flex-wrap items-center gap-1.5">
              {associations}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
