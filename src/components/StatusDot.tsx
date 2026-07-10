interface Props {
  active: boolean
  title?: string
}

export default function StatusDot({ active, title }: Props) {
  return (
    <span
      className={`h-1.5 w-1.5 shrink-0 rounded-full ${
        active ? 'bg-success shadow-[0_0_0_2px_rgba(34,197,94,0.15)]' : 'bg-warning shadow-[0_0_0_2px_rgba(245,158,11,0.12)]'
      }`}
      title={title}
    />
  )
}
