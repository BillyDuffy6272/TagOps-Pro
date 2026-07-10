import type { ReactNode } from 'react'

interface Props {
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  maxWidth?: number
}

export default function Modal({ title, onClose, children, footer, maxWidth = 520 }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[88vh] w-full flex-col overflow-hidden rounded-lg border border-border bg-surface-overlay shadow-2xl shadow-black/60"
        style={{ maxWidth }}
        onClick={e => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-border-subtle px-5 py-4">
          <h2 className="m-0 text-[15px] font-semibold text-text-primary">{title}</h2>
          <button
            type="button"
            className="rounded p-1 text-[15px] leading-none text-text-tertiary transition-colors duration-150 ease-out hover:bg-white/6 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </header>

        <div className="flex flex-col gap-5 overflow-y-auto p-5">{children}</div>

        {footer && (
          <footer className="flex justify-end gap-2.5 border-t border-border px-5 py-4">{footer}</footer>
        )}
      </div>
    </div>
  )
}
