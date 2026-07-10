import type { ReactNode } from 'react'

interface Props {
  message: string
  action?: ReactNode
}

export default function EmptyState({ message, action }: Props) {
  return (
    <div className="flex flex-col items-center gap-4 px-6 py-16 text-center">
      <p className="m-0 max-w-sm text-[13.5px] leading-relaxed text-text-tertiary">{message}</p>
      {action}
    </div>
  )
}
