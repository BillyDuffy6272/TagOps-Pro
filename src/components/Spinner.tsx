interface Props {
  size?: number
}

export default function Spinner({ size = 15 }: Props) {
  return (
    <div
      className="shrink-0 animate-spin rounded-full border-[1.5px] border-border border-t-accent"
      style={{ width: size, height: size }}
    />
  )
}
