import { eventLabel, type SimStep } from '../lib/simulator'

interface Props {
  steps: SimStep[]
  selectedEventId: number | null
  onSelect: (eventId: number) => void
}

// Newest-first event list, like the left rail of GTM's debug pane.
export default function EventTimeline({ steps, selectedEventId, onSelect }: Props) {
  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-border-subtle bg-surface-sunken">
      <div className="border-b border-border-subtle px-4 py-2.5 text-[10.5px] font-semibold tracking-[0.07em] text-text-faint uppercase">
        Event stream
      </div>
      <div className="flex flex-col-reverse overflow-y-auto">
        {steps.map((step, index) => {
          const isSelected = step.event.id === selectedEventId
          return (
            <button
              key={step.event.id}
              type="button"
              className={`flex w-full items-center gap-3 border-t border-border-subtle px-4 py-2.5 text-left transition-colors duration-150 ease-out first:border-t-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent ${
                isSelected ? 'bg-accent-muted' : 'hover:bg-white/5'
              }`}
              onClick={() => onSelect(step.event.id)}
            >
              <span className={`w-5 shrink-0 text-right font-mono text-[11px] ${isSelected ? 'text-accent' : 'text-text-faint'}`}>
                {index + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className={`block truncate text-[13px] font-semibold ${isSelected ? 'text-text-primary' : 'text-text-secondary'}`}>
                  {eventLabel(step.event.name)}
                </span>
                <span className="block truncate font-mono text-[11px] text-text-faint">{step.event.name}</span>
              </span>
              <span
                className={`shrink-0 rounded-md px-1.5 py-0.5 font-mono text-[10.5px] font-semibold ${
                  step.firedCount > 0 ? 'bg-success/10 text-success' : 'bg-white/5 text-text-faint'
                }`}
                title={`${step.firedCount} tag(s) fired on this event`}
              >
                {step.firedCount}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
