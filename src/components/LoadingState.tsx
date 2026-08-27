import Spinner from './Spinner'

interface Props {
  label: string
}

export default function LoadingState({ label }: Props) {
  return (
    <div className="flex items-center gap-2.5 px-0 py-16 text-[13.5px] text-text-tertiary" role="status" aria-live="polite">
      <Spinner />
      <span>{label}</span>
    </div>
  )
}
