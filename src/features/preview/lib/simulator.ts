import { triggerEventName, triggersById, type GtmTag, type GtmTrigger } from '../../../lib/gtm'

// A local, read-only re-implementation of GTM's preview/debug semantics:
// events are replayed against the container's real tags and triggers to show
// which tags would fire and why. Nothing is injected into a real page and no
// real hits are sent — that's the point (see docs: tracking-platform safety).

export interface SimEvent {
  id: number
  name: string
  data: Record<string, unknown>
}

export type TagStatus = 'fired' | 'not-fired' | 'paused' | 'blocked'

export interface TagResult {
  tag: GtmTag
  status: TagStatus
  matchedTriggers: GtmTrigger[]
  blockedBy: GtmTrigger[]
  // Firing conditions ("Page URL contains /checkout") can't be evaluated
  // without a real page, so they're surfaced as a caveat instead of guessed.
  unevaluatedConditions: number
  reason: string
}

export interface SimStep {
  event: SimEvent
  results: TagResult[]
  firedCount: number
  // Data layer model after this event (GTM merges each push into the model).
  dataLayer: Record<string, unknown>
}

// Which dataLayer event each built-in trigger type listens for.
export const TRIGGER_EVENT_MAP: Record<string, string> = {
  consentInit: 'gtm.init_consent',
  init: 'gtm.init',
  pageview: 'gtm.js',
  domReady: 'gtm.dom',
  windowLoaded: 'gtm.load',
  click: 'gtm.click',
  linkClick: 'gtm.linkClick',
  formSubmission: 'gtm.formSubmit',
  historyChange: 'gtm.historyChange',
  jsError: 'gtm.pageError',
  timer: 'gtm.timer',
  scrollDepth: 'gtm.scrollDepth',
  elementVisibility: 'gtm.elementVisibility',
  youTubeVideo: 'gtm.video',
}

// GTM's implicit triggers use fixed IDs and are never returned by the
// triggers API, so tags wired to them ("All Pages") would otherwise look
// like they never fire.
const BUILT_IN_TRIGGERS: Record<string, GtmTrigger> = {
  '2147479553': { triggerId: '2147479553', name: 'All Pages', type: 'pageview', path: '' },
  '2147479572': { triggerId: '2147479572', name: 'Consent Initialization - All Pages', type: 'consentInit', path: '' },
  '2147479573': { triggerId: '2147479573', name: 'Initialization - All Pages', type: 'init', path: '' },
}

export function resolveTriggers(triggerIds: string[] | undefined, triggers: GtmTrigger[]): GtmTrigger[] {
  if (!triggerIds || triggerIds.length === 0) return []
  const custom = triggersById(triggerIds, triggers)
  const builtIn = triggerIds.map(id => BUILT_IN_TRIGGERS[id]).filter((t): t is GtmTrigger => Boolean(t))
  return [...custom, ...builtIn]
}

export function triggerMatchesEvent(trigger: GtmTrigger, eventName: string): boolean {
  if (trigger.type === 'customEvent') {
    const expected = triggerEventName(trigger)
    if (!expected) return false
    // GTM's "use regex matching" option stores the condition as matchRegex.
    if (trigger.customEventFilter?.[0]?.type === 'matchRegex') {
      try {
        return new RegExp(expected).test(eventName)
      } catch {
        return false
      }
    }
    return expected === eventName
  }
  const mapped = TRIGGER_EVENT_MAP[trigger.type]
  return mapped !== undefined && mapped === eventName
}

function conditionCount(trigger: GtmTrigger): number {
  return (trigger.filter?.length ?? 0) + (trigger.autoEventFilter?.length ?? 0)
}

export function evaluateTag(tag: GtmTag, event: SimEvent, triggers: GtmTrigger[]): TagResult {
  const firing = resolveTriggers(tag.firingTriggerId, triggers)
  const blocking = resolveTriggers(tag.blockingTriggerId, triggers)

  const matchedTriggers = firing.filter(t => triggerMatchesEvent(t, event.name))
  const blockedBy = blocking.filter(t => triggerMatchesEvent(t, event.name))

  if (matchedTriggers.length === 0) {
    return {
      tag, status: 'not-fired', matchedTriggers, blockedBy: [], unevaluatedConditions: 0,
      reason: firing.length === 0 ? 'No firing triggers attached' : 'No firing trigger matched this event',
    }
  }
  if (tag.paused) {
    return {
      tag, status: 'paused', matchedTriggers, blockedBy, unevaluatedConditions: 0,
      reason: `Matched "${matchedTriggers[0].name}" but the tag is paused`,
    }
  }
  if (blockedBy.length > 0) {
    return {
      tag, status: 'blocked', matchedTriggers, blockedBy, unevaluatedConditions: 0,
      reason: `Blocked by exception trigger "${blockedBy[0].name}"`,
    }
  }
  const unevaluatedConditions = matchedTriggers.reduce((sum, t) => sum + conditionCount(t), 0)
  return {
    tag, status: 'fired', matchedTriggers, blockedBy, unevaluatedConditions,
    reason: `Fired on "${matchedTriggers[0].name}"`,
  }
}

export function runSimulation(events: SimEvent[], tags: GtmTag[], triggers: GtmTrigger[]): SimStep[] {
  const steps: SimStep[] = []
  let dataLayer: Record<string, unknown> = {}

  for (const event of events) {
    // Shallow merge, matching how pushes update the data layer model at the
    // top level. (GTM merges nested objects recursively; a simulation-level
    // approximation that's called out in the UI.)
    dataLayer = { ...dataLayer, ...event.data, event: event.name }
    const results = tags.map(tag => evaluateTag(tag, event, triggers))
    steps.push({
      event,
      results,
      firedCount: results.filter(r => r.status === 'fired').length,
      dataLayer,
    })
  }
  return steps
}

// Friendly names for the lifecycle events, mirroring GTM's debug pane.
const EVENT_LABELS: Record<string, string> = {
  'gtm.init_consent': 'Consent Initialization',
  'gtm.init': 'Initialization',
  'gtm.js': 'Container Loaded',
  'gtm.dom': 'DOM Ready',
  'gtm.load': 'Window Loaded',
  'gtm.click': 'Click',
  'gtm.linkClick': 'Link Click',
  'gtm.formSubmit': 'Form Submit',
  'gtm.historyChange': 'History Change',
  'gtm.scrollDepth': 'Scroll Depth',
  'gtm.timer': 'Timer',
  'gtm.pageError': 'JavaScript Error',
  'gtm.video': 'YouTube Video',
  'gtm.elementVisibility': 'Element Visibility',
}

export function eventLabel(name: string): string {
  return EVENT_LABELS[name] ?? name
}

// The event sequence GTM itself emits on every page load, in order.
export const PAGE_LOAD_EVENTS: { name: string; data: Record<string, unknown> }[] = [
  { name: 'gtm.init_consent', data: {} },
  { name: 'gtm.init', data: {} },
  { name: 'gtm.js', data: { 'gtm.start': true } },
  { name: 'gtm.dom', data: {} },
  { name: 'gtm.load', data: {} },
]

// One-click user interactions for the simulator palette, with realistic
// auto-event payloads so the data layer inspector has something to show.
export const SIMULATED_ACTIONS: { name: string; label: string; data: Record<string, unknown> }[] = [
  { name: 'gtm.click', label: 'Click', data: { 'gtm.element': 'button#cta', 'gtm.elementClasses': 'btn btn-primary', 'gtm.elementId': 'cta' } },
  { name: 'gtm.linkClick', label: 'Link click', data: { 'gtm.elementUrl': 'https://example.com/pricing', 'gtm.elementText': 'View pricing' } },
  { name: 'gtm.formSubmit', label: 'Form submit', data: { 'gtm.elementId': 'contact-form', 'gtm.elementUrl': '/thank-you' } },
  { name: 'gtm.historyChange', label: 'History change', data: { 'gtm.newUrl': '/step-2', 'gtm.oldUrl': '/step-1' } },
  { name: 'gtm.scrollDepth', label: 'Scroll depth', data: { 'gtm.scrollThreshold': 50, 'gtm.scrollUnits': 'percent', 'gtm.scrollDirection': 'vertical' } },
  { name: 'gtm.timer', label: 'Timer', data: { 'gtm.timerInterval': 30000, 'gtm.timerEventNumber': 1 } },
  { name: 'gtm.pageError', label: 'JS error', data: { 'gtm.errorMessage': 'Uncaught TypeError: demo', 'gtm.errorLineNumber': 42 } },
  { name: 'gtm.video', label: 'YouTube video', data: { 'gtm.videoStatus': 'start', 'gtm.videoPercent': 0 } },
  { name: 'gtm.elementVisibility', label: 'Element visibility', data: { 'gtm.visibleRatio': 100, 'gtm.visibleTime': 1000 } },
]
