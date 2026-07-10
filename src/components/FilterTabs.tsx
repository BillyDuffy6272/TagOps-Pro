interface Props<T extends string> {
  options: T[]
  value: T
  onChange: (value: T) => void
}

export default function FilterTabs<T extends string>({ options, value, onChange }: Props<T>) {
  return (
    <div className="flex gap-px rounded-md border border-border-subtle bg-surface-sunken p-[3px]">
      {options.map(option => (
        <button
          key={option}
          type="button"
          className={`rounded-[5px] px-3.5 py-1.5 text-xs font-medium transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
            value === option
              ? 'bg-surface-raised text-text-primary shadow-[0_1px_0_rgba(255,255,255,0.04)]'
              : 'text-text-tertiary hover:bg-white/4 hover:text-text-secondary'
          }`}
          onClick={() => onChange(option)}
        >
          {option.charAt(0).toUpperCase() + option.slice(1)}
        </button>
      ))}
    </div>
  )
}
