interface Props {
  message: string
  onDismiss: () => void
}

export default function ErrorBanner({ message, onDismiss }: Props) {
  return (
    <div className="mb-6 flex items-center justify-between gap-3 rounded-lg border border-danger/20 bg-danger/10 px-3.5 py-2.5 text-[13px] text-danger-text">
      <span>{message}</span>
      <button
        type="button"
        className="shrink-0 p-0 text-base leading-none text-danger-text opacity-60 transition-opacity duration-150 ease-out hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        onClick={onDismiss}
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  )
}
