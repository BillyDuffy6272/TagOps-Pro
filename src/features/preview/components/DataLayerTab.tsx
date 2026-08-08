interface Props {
  dataLayer: Record<string, unknown>
  label: string
}

export default function DataLayerTab({ dataLayer, label }: Props) {
  return (
    <div className="overflow-hidden rounded-lg border border-border-subtle bg-surface-sunken">
      <div className="border-b border-border-subtle px-4 py-2.5 text-[10.5px] font-semibold tracking-[0.07em] text-text-faint uppercase">
        {label}
      </div>
      <pre className="m-0 overflow-x-auto p-4 font-mono text-[12px] leading-relaxed text-text-secondary">
        {JSON.stringify(dataLayer, null, 2)}
      </pre>
    </div>
  )
}
