interface Props<T extends string> {
  options: T[]
  value: T
  onChange: (value: T) => void
}

export default function FilterTabs<T extends string>({ options, value, onChange }: Props<T>) {
  return (
    <div className="flex gap-px rounded-lg border border-border bg-surface p-[3px]">
      {options.map(option => (
        <button
          key={option}
          type="button"
          className={`rounded-md px-3.5 py-1.5 text-xs font-medium transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
            value === option
              ? 'bg-surface-raised text-text-primary'
              : 'text-text-tertiary hover:text-text-secondary'
          }`}
          onClick={() => onChange(option)}
        >
          {option.charAt(0).toUpperCase() + option.slice(1)}
        </button>
      ))}
    </div>
  )
}
