import { triggerEventName, triggersById, type GtmTag, type GtmTrigger, type GtmVariable } from '../../../lib/gtm'

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

export interface TagSummary {
  tag: GtmTag
  fireCount: number
  lastResult: TagResult
}

// Session-wide rollup across every simulated event so far, mirroring the
// pinned "Summary" entry above the per-event stages in GTM's own debug pane.
export function summarizeSteps(steps: SimStep[]): TagSummary[] {
  if (steps.length === 0) return []
  const latestResults = steps[steps.length - 1].results
  return latestResults.map(lastResult => ({
    tag: lastResult.tag,
    fireCount: steps.filter(step => step.results.find(r => r.tag.tagId === lastResult.tag.tagId)?.status === 'fired').length,
    lastResult,
  }))
}

// All the steps (in order) where this tag actually fired — the equivalent of
// GTM's "Messages Where This Tag Fired" list in its own tag-detail drilldown.
export function tagFiredSteps(steps: SimStep[], tagId: string): SimStep[] {
  return steps.filter(step => step.results.find(r => r.tag.tagId === tagId)?.status === 'fired')
}

export interface VariableResult {
  variable: GtmVariable
  value: unknown
  // Only variable types the simulator can actually compute without a real
  // page (constants, data layer reads, and the auto-event fields the click/
  // form/etc. simulator produces) get a value; everything else (DOM/JS/URL/
  // cookie variables) is surfaced as unresolved rather than guessed.
  resolved: boolean
  // Set only when unresolved, to explain why rather than showing the same
  // generic message for every unsupported type.
  reason?: string
}

// GTM's built-in Auto-Event Variable types, mapped to the gtm.* dataLayer
// keys the SIMULATED_ACTIONS payloads below actually populate.
const AEV_KEY_MAP: Record<string, string> = {
  ELEMENT: 'gtm.element',
  ELEMENT_URL: 'gtm.elementUrl',
  ELEMENT_ID: 'gtm.elementId',
  ELEMENT_CLASSES: 'gtm.elementClasses',
  ELEMENT_TEXT: 'gtm.elementText',
  HISTORY_NEW_URL_FRAGMENT: 'gtm.newUrl',
  HISTORY_OLD_URL_FRAGMENT: 'gtm.oldUrl',
  SCROLL_DEPTH_THRESHOLD: 'gtm.scrollThreshold',
  SCROLL_DEPTH_UNITS: 'gtm.scrollUnits',
  SCROLL_DEPTH_DIRECTION: 'gtm.scrollDirection',
  ERROR_MESSAGE: 'gtm.errorMessage',
  ERROR_LINE: 'gtm.errorLineNumber',
  VIDEO_STATUS: 'gtm.videoStatus',
  VIDEO_PERCENT: 'gtm.videoPercent',
  ELEMENT_VISIBILITY_RATIO: 'gtm.visibleRatio',
  ELEMENT_VISIBILITY_TIME: 'gtm.visibleTime',
}

// GTM's built-in variables are container-level toggles, not workspace
// entities, so — like BUILT_IN_TRIGGERS above — the API never returns them.
// The common ones are hardcoded here so the preview's Variables tab lists
// them the same way GTM's own Tag Assistant does. Each either maps to a
// gtm.* key SIMULATED_ACTIONS already populates, or (for the page-context
// ones GTM would read off the real page) stays honestly unresolved rather
// than guessed from TagOps Pro's own URL — see docs/decision-log.md ADR-0019.
export const BUILT_IN_VARIABLES: GtmVariable[] = [
  { variableId: 'builtin:debugMode', name: 'Debug Mode', type: 'builtin', path: '' },
  { variableId: 'builtin:event', name: 'Event', type: 'builtin', path: '' },
  { variableId: 'builtin:pageUrl', name: 'Page URL', type: 'builtin', path: '' },
  { variableId: 'builtin:pageHostname', name: 'Page Hostname', type: 'builtin', path: '' },
  { variableId: 'builtin:pagePath', name: 'Page Path', type: 'builtin', path: '' },
  { variableId: 'builtin:referrer', name: 'Referrer', type: 'builtin', path: '' },
  { variableId: 'builtin:clickElement', name: 'Click Element', type: 'builtin', path: '' },
  { variableId: 'builtin:clickClasses', name: 'Click Classes', type: 'builtin', path: '' },
  { variableId: 'builtin:clickId', name: 'Click ID', type: 'builtin', path: '' },
  { variableId: 'builtin:clickTarget', name: 'Click Target', type: 'builtin', path: '' },
  { variableId: 'builtin:clickText', name: 'Click Text', type: 'builtin', path: '' },
  { variableId: 'builtin:clickUrl', name: 'Click URL', type: 'builtin', path: '' },
  { variableId: 'builtin:formElement', name: 'Form Element', type: 'builtin', path: '' },
  { variableId: 'builtin:formId', name: 'Form ID', type: 'builtin', path: '' },
  { variableId: 'builtin:formUrl', name: 'Form URL', type: 'builtin', path: '' },
  { variableId: 'builtin:newHistoryFragment', name: 'New History Fragment', type: 'builtin', path: '' },
  { variableId: 'builtin:oldHistoryFragment', name: 'Old History Fragment', type: 'builtin', path: '' },
  { variableId: 'builtin:scrollDepthThreshold', name: 'Scroll Depth Threshold', type: 'builtin', path: '' },
  { variableId: 'builtin:scrollDepthUnits', name: 'Scroll Depth Units', type: 'builtin', path: '' },
  { variableId: 'builtin:scrollDirection', name: 'Scroll Direction', type: 'builtin', path: '' },
  { variableId: 'builtin:errorMessage', name: 'Error Message', type: 'builtin', path: '' },
  { variableId: 'builtin:errorLine', name: 'Error Line', type: 'builtin', path: '' },
  { variableId: 'builtin:videoStatus', name: 'Video Status', type: 'builtin', path: '' },
  { variableId: 'builtin:videoPercent', name: 'Video Percent', type: 'builtin', path: '' },
  { variableId: 'builtin:percentVisible', name: 'Percent Visible', type: 'builtin', path: '' },
  { variableId: 'builtin:onScreenDuration', name: 'On-Screen Duration', type: 'builtin', path: '' },
]

// Mirrors AEV_KEY_MAP, but keyed by the built-in's own variableId rather
// than a GTM varType code, since built-ins don't carry a varType parameter.
const BUILT_IN_KEY_MAP: Record<string, string> = {
  'builtin:clickElement': 'gtm.element',
  'builtin:clickClasses': 'gtm.elementClasses',
  'builtin:clickId': 'gtm.elementId',
  'builtin:clickText': 'gtm.elementText',
  'builtin:clickUrl': 'gtm.elementUrl',
  'builtin:formElement': 'gtm.element',
  'builtin:formId': 'gtm.elementId',
  'builtin:formUrl': 'gtm.elementUrl',
  'builtin:newHistoryFragment': 'gtm.newUrl',
  'builtin:oldHistoryFragment': 'gtm.oldUrl',
  'builtin:scrollDepthThreshold': 'gtm.scrollThreshold',
  'builtin:scrollDepthUnits': 'gtm.scrollUnits',
  'builtin:scrollDirection': 'gtm.scrollDirection',
  'builtin:errorMessage': 'gtm.errorMessage',
  'builtin:errorLine': 'gtm.errorLineNumber',
  'builtin:videoStatus': 'gtm.videoStatus',
  'builtin:videoPercent': 'gtm.videoPercent',
  'builtin:percentVisible': 'gtm.visibleRatio',
  'builtin:onScreenDuration': 'gtm.visibleTime',
}

// GTM reads these off the real loaded page. This simulator never loads one
// (that's the "firing verification" roadmap item, not preview — ADR-0019),
// so they stay unresolved with an explanation instead of a generic message.
const PAGE_CONTEXT_BUILT_INS = new Set(['builtin:pageUrl', 'builtin:pageHostname', 'builtin:pagePath', 'builtin:referrer'])

export function resolveVariable(variable: GtmVariable, dataLayer: Record<string, unknown>): VariableResult {
  if (variable.type === 'c') {
    const value = variable.parameter?.find(p => p.key === 'value')?.value
    return { variable, value, resolved: value !== undefined }
  }
  if (variable.type === 'v') {
    const name = variable.parameter?.find(p => p.key === 'name')?.value
    return { variable, value: name ? dataLayer[name] : undefined, resolved: name !== undefined }
  }
  if (variable.type === 'aev') {
    const varType = variable.parameter?.find(p => p.key === 'varType')?.value
    const key = varType ? AEV_KEY_MAP[varType] : undefined
    return { variable, value: key ? dataLayer[key] : undefined, resolved: key !== undefined }
  }
  if (variable.type === 'builtin') {
    if (variable.variableId === 'builtin:debugMode') return { variable, value: true, resolved: true }
    if (variable.variableId === 'builtin:event') return { variable, value: dataLayer.event, resolved: true }
    if (PAGE_CONTEXT_BUILT_INS.has(variable.variableId)) {
      return { variable, value: undefined, resolved: false, reason: 'Needs a real loaded page — not available in simulation' }
    }
    const key = BUILT_IN_KEY_MAP[variable.variableId]
    return { variable, value: key ? dataLayer[key] : undefined, resolved: key !== undefined }
  }
  return { variable, value: undefined, resolved: false }
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
