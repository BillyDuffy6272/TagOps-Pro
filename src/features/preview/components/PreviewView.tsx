import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getDefaultWorkspace, getTags, getTriggers, type GtmTag, type GtmTrigger } from '../../../lib/gtm'
import { useGtm } from '../../../lib/GtmContext'
import { PAGE_LOAD_EVENTS, runSimulation, type SimEvent } from '../lib/simulator'
import EventTimeline from './EventTimeline'
import TagResultsPanel from './TagResultsPanel'
import SimulateBar from './SimulateBar'
import ViewHeader from '../../../components/ViewHeader'
import ErrorBanner from '../../../components/ErrorBanner'
import LoadingState from '../../../components/LoadingState'
import EmptyState from '../../../components/EmptyState'
import GtmForbiddenState from '../../../components/GtmForbiddenState'
import ContainerPicker from '../../../components/ContainerPicker'

export default function PreviewView() {
  const { token, selectedAccount, selectedContainer, selectedGtmContainer, loadingAccounts, gtmForbidden, setGtmForbidden, error: contextError, clearError, refreshKey } = useGtm()

  const [tags, setTags] = useState<GtmTag[]>([])
  const [triggers, setTriggers] = useState<GtmTrigger[]>([])
  const [events, setEvents] = useState<SimEvent[]>([])
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null)
  const [started, setStarted] = useState(false)

  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const nextIdRef = useRef(1)

  const makeEvent = useCallback((name: string, data: Record<string, unknown>): SimEvent => {
    return { id: nextIdRef.current++, name, data }
  }, [])

  const loadContainerAssets = useCallback(async () => {
    if (!selectedAccount || !selectedContainer) return
    setSyncing(true)
    setError(null)
    try {
      const ws = await getDefaultWorkspace(selectedAccount, selectedContainer, token)
      if (!ws) { setTags([]); setTriggers([]); return }
      const [fetchedTags, fetchedTriggers] = await Promise.all([
        getTags(selectedAccount, selectedContainer, ws.workspaceId, token),
        getTriggers(selectedAccount, selectedContainer, ws.workspaceId, token),
      ])
      setTags(fetchedTags)
      setTriggers(fetchedTriggers)
    } catch (e: unknown) {
      if ((e as { status?: number }).status === 403) setGtmForbidden(true)
      else setError(e instanceof Error ? e.message : 'Failed to load container')
    } finally {
      setSyncing(false)
    }
    // refreshKey retriggers the load after a cache-clearing sync
  }, [token, selectedAccount, selectedContainer, setGtmForbidden, refreshKey]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadContainerAssets() }, [loadContainerAssets])

  // A preview session is per-container; switching containers ends it.
  useEffect(() => {
    setStarted(false)
    setEvents([])
    setSelectedEventId(null)
  }, [selectedContainer])

  function startPreview() {
    const pageLoad = PAGE_LOAD_EVENTS.map(e => makeEvent(e.name, e.data))
    setEvents(pageLoad)
    setSelectedEventId(pageLoad[pageLoad.length - 1]?.id ?? null)
    setStarted(true)
  }

  function endPreview() {
    setStarted(false)
    setEvents([])
    setSelectedEventId(null)
  }

  function simulate(name: string, data: Record<string, unknown>) {
    const event = makeEvent(name, data)
    setEvents(prev => [...prev, event])
    setSelectedEventId(event.id)
  }

  const steps = useMemo(() => runSimulation(events, tags, triggers), [events, tags, triggers])
  const selectedStep = steps.find(s => s.event.id === selectedEventId) ?? steps[steps.length - 1] ?? null

  if (gtmForbidden) return <GtmForbiddenState title="Preview" />

  const shownError = error ?? contextError

  return (
    <div className="mx-auto max-w-[1180px] px-10 pt-10 pb-15">
      <ViewHeader
        title="Preview"
        subtitle="Replay events against your live container config — like GTM preview, without touching your site"
        action={started ? (
          <button
            type="button"
            className="rounded-md border border-warning/30 bg-warning/10 px-4 py-1.5 text-[13px] font-semibold whitespace-nowrap text-warning transition-colors duration-150 ease-out hover:bg-warning/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warning focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
            onClick={endPreview}
          >
            End preview
          </button>
        ) : undefined}
      />

      {shownError && <ErrorBanner message={shownError} onDismiss={() => { setError(null); clearError() }} />}

      {started && (
        <div className="mb-6 flex flex-wrap items-center gap-2.5 rounded-lg border border-warning/25 bg-warning/10 px-4 py-2.5 text-[12.5px] text-warning">
          <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-warning" aria-hidden="true" />
          <strong className="font-semibold">Preview mode</strong>
          <span className="text-warning/80">
            Debugging {selectedGtmContainer ? `${selectedGtmContainer.name} (${selectedGtmContainer.publicId})` : 'container'} —
            events are simulated locally, no real hits are sent.
          </span>
        </div>
      )}

      <ContainerPicker idPrefix="preview" syncing={syncing} />

      {loadingAccounts || syncing ? (
        <LoadingState label={loadingAccounts ? 'Loading accounts…' : 'Loading container…'} />
      ) : !selectedContainer ? (
        <EmptyState message="No containers in this GTM account." />
      ) : !started ? (
        <div className="flex flex-col items-center gap-4 rounded-lg border border-border-subtle bg-surface-sunken px-8 py-14 text-center">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-faint" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <polygon points="10 8 16 12 10 16 10 8" />
          </svg>
          <div>
            <h2 className="m-0 mb-1 text-[15px] font-semibold text-text-primary">Start a preview session</h2>
            <p className="m-0 max-w-[480px] text-[13px] leading-relaxed text-text-tertiary">
              Replays a page load through {tags.length} tag{tags.length === 1 ? '' : 's'} and {triggers.length} trigger{triggers.length === 1 ? '' : 's'} from this
              container, then lets you simulate clicks, form submits and custom dataLayer events to see exactly which tags would fire — and why the rest didn't.
            </p>
          </div>
          <button
            type="button"
            className="rounded-md bg-accent px-5 py-2 text-[13.5px] font-semibold text-canvas transition-colors duration-150 ease-out hover:bg-accent/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:cursor-not-allowed disabled:opacity-40"
            onClick={startPreview}
            disabled={tags.length === 0}
          >
            Start preview
          </button>
          {tags.length === 0 && (
            <p className="m-0 text-[12px] text-text-faint">This container has no tags to preview.</p>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <SimulateBar onSimulate={simulate} />
          <div className="grid grid-cols-[280px_1fr] items-start gap-4 max-lg:grid-cols-1">
            <EventTimeline steps={steps} selectedEventId={selectedStep?.event.id ?? null} onSelect={setSelectedEventId} />
            {selectedStep ? (
              <TagResultsPanel step={selectedStep} />
            ) : (
              <EmptyState message="Select an event to inspect it." />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
