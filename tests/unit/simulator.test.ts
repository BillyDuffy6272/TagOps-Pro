import { describe, expect, it } from 'vitest'
import type { GtmTag, GtmTrigger, GtmVariable } from '../../src/lib/gtm'
import {
  PAGE_LOAD_EVENTS,
  evaluateTag,
  eventLabel,
  resolveTriggers,
  resolveVariable,
  runSimulation,
  tagFiredSteps,
  triggerMatchesEvent,
  type SimEvent,
} from '../../src/features/preview/lib/simulator'

function makeTag(overrides: Partial<GtmTag>): GtmTag {
  return { tagId: 't1', name: 'Test tag', type: 'ga4Event', path: '', ...overrides }
}

function makeTrigger(overrides: Partial<GtmTrigger>): GtmTrigger {
  return { triggerId: 'tr1', name: 'Test trigger', type: 'pageview', path: '', ...overrides }
}

function makeVariable(overrides: Partial<GtmVariable>): GtmVariable {
  return { variableId: 'v1', name: 'Test variable', type: 'c', path: '', ...overrides }
}

function makeEvent(name: string, data: Record<string, unknown> = {}, id = 1): SimEvent {
  return { id, name, data }
}

describe('triggerMatchesEvent', () => {
  it('matches built-in trigger types to their gtm.* events', () => {
    expect(triggerMatchesEvent(makeTrigger({ type: 'pageview' }), 'gtm.js')).toBe(true)
    expect(triggerMatchesEvent(makeTrigger({ type: 'domReady' }), 'gtm.dom')).toBe(true)
    expect(triggerMatchesEvent(makeTrigger({ type: 'windowLoaded' }), 'gtm.load')).toBe(true)
    expect(triggerMatchesEvent(makeTrigger({ type: 'click' }), 'gtm.click')).toBe(true)
    expect(triggerMatchesEvent(makeTrigger({ type: 'formSubmission' }), 'gtm.formSubmit')).toBe(true)
  })

  it('does not match a trigger to a different event', () => {
    expect(triggerMatchesEvent(makeTrigger({ type: 'pageview' }), 'gtm.dom')).toBe(false)
    expect(triggerMatchesEvent(makeTrigger({ type: 'click' }), 'gtm.linkClick')).toBe(false)
  })

  it('never matches unknown trigger types', () => {
    expect(triggerMatchesEvent(makeTrigger({ type: 'somethingNew' }), 'gtm.js')).toBe(false)
  })

  it('matches custom event triggers by exact event name', () => {
    const trigger = makeTrigger({ type: 'customEvent', eventName: { type: 'template', value: 'purchase' } })
    expect(triggerMatchesEvent(trigger, 'purchase')).toBe(true)
    expect(triggerMatchesEvent(trigger, 'purchase_completed')).toBe(false)
  })

  it('reads the event name from the customEventFilter fallback', () => {
    const trigger = makeTrigger({
      type: 'customEvent',
      customEventFilter: [{
        type: 'equals',
        parameter: [
          { type: 'template', key: 'arg0', value: '{{_event}}' },
          { type: 'template', key: 'arg1', value: 'sign_up' },
        ],
      }],
    })
    expect(triggerMatchesEvent(trigger, 'sign_up')).toBe(true)
  })

  it('supports regex matching when the filter type is matchRegex', () => {
    const trigger = makeTrigger({
      type: 'customEvent',
      customEventFilter: [{
        type: 'matchRegex',
        parameter: [
          { type: 'template', key: 'arg0', value: '{{_event}}' },
          { type: 'template', key: 'arg1', value: '^purchase.*' },
        ],
      }],
    })
    expect(triggerMatchesEvent(trigger, 'purchase')).toBe(true)
    expect(triggerMatchesEvent(trigger, 'purchase_completed')).toBe(true)
    expect(triggerMatchesEvent(trigger, 'add_to_cart')).toBe(false)
  })

  it('treats an invalid regex as non-matching instead of throwing', () => {
    const trigger = makeTrigger({
      type: 'customEvent',
      customEventFilter: [{
        type: 'matchRegex',
        parameter: [
          { type: 'template', key: 'arg0', value: '{{_event}}' },
          { type: 'template', key: 'arg1', value: '(' },
        ],
      }],
    })
    expect(triggerMatchesEvent(trigger, 'anything')).toBe(false)
  })
})

describe('resolveTriggers', () => {
  it("resolves GTM's built-in All Pages trigger id", () => {
    const resolved = resolveTriggers(['2147479553'], [])
    expect(resolved).toHaveLength(1)
    expect(resolved[0].name).toBe('All Pages')
    expect(resolved[0].type).toBe('pageview')
  })

  it('combines workspace triggers with built-ins', () => {
    const custom = makeTrigger({ triggerId: '42' })
    expect(resolveTriggers(['42', '2147479553'], [custom])).toHaveLength(2)
  })
})

describe('evaluateTag', () => {
  const allPages = ['2147479553']

  it('fires a tag on All Pages at container load', () => {
    const tag = makeTag({ firingTriggerId: allPages })
    const result = evaluateTag(tag, makeEvent('gtm.js'), [])
    expect(result.status).toBe('fired')
    expect(result.reason).toContain('All Pages')
  })

  it('reports paused tags as paused even when a trigger matches', () => {
    const tag = makeTag({ firingTriggerId: allPages, paused: true })
    expect(evaluateTag(tag, makeEvent('gtm.js'), []).status).toBe('paused')
  })

  it('reports blocked tags when an exception trigger matches', () => {
    const blocker = makeTrigger({ triggerId: '9', name: 'Block on all pages', type: 'pageview' })
    const tag = makeTag({ firingTriggerId: allPages, blockingTriggerId: ['9'] })
    const result = evaluateTag(tag, makeEvent('gtm.js'), [blocker])
    expect(result.status).toBe('blocked')
    expect(result.reason).toContain('Block on all pages')
  })

  it('distinguishes "no triggers attached" from "no trigger matched"', () => {
    const noTriggers = evaluateTag(makeTag({}), makeEvent('gtm.js'), [])
    expect(noTriggers.status).toBe('not-fired')
    expect(noTriggers.reason).toBe('No firing triggers attached')

    const wrongEvent = evaluateTag(makeTag({ firingTriggerId: allPages }), makeEvent('gtm.click'), [])
    expect(wrongEvent.status).toBe('not-fired')
    expect(wrongEvent.reason).toBe('No firing trigger matched this event')
  })

  it('counts trigger conditions the simulation cannot evaluate', () => {
    const conditional = makeTrigger({
      triggerId: '7',
      type: 'pageview',
      filter: [{ type: 'contains' }, { type: 'equals' }],
    })
    const tag = makeTag({ firingTriggerId: ['7'] })
    const result = evaluateTag(tag, makeEvent('gtm.js'), [conditional])
    expect(result.status).toBe('fired')
    expect(result.unevaluatedConditions).toBe(2)
  })
})

describe('runSimulation', () => {
  it('replays the page-load sequence and accumulates the data layer', () => {
    const events = PAGE_LOAD_EVENTS.map((e, i) => makeEvent(e.name, e.data, i + 1))
    const steps = runSimulation(events, [], [])
    expect(steps).toHaveLength(5)
    expect(steps[4].dataLayer).toMatchObject({ 'gtm.start': true, event: 'gtm.load' })
  })

  it('merges later pushes over earlier ones, latest event name wins', () => {
    const steps = runSimulation(
      [
        makeEvent('purchase', { value: 10, currency: 'AUD' }, 1),
        makeEvent('refund', { value: -10 }, 2),
      ],
      [], []
    )
    expect(steps[1].dataLayer).toEqual({ value: -10, currency: 'AUD', event: 'refund' })
  })

  it('counts fired tags per step', () => {
    const tag = makeTag({ firingTriggerId: ['2147479553'] })
    const steps = runSimulation(
      [makeEvent('gtm.js', {}, 1), makeEvent('gtm.dom', {}, 2)],
      [tag], []
    )
    expect(steps[0].firedCount).toBe(1)
    expect(steps[1].firedCount).toBe(0)
  })
})

describe('eventLabel', () => {
  it('gives friendly names to lifecycle events and passes through custom names', () => {
    expect(eventLabel('gtm.js')).toBe('Container Loaded')
    expect(eventLabel('purchase')).toBe('purchase')
  })
})

describe('tagFiredSteps', () => {
  it('returns only the steps where the given tag actually fired', () => {
    const tag = makeTag({ firingTriggerId: ['2147479553'] })
    const steps = runSimulation(
      [makeEvent('gtm.js', {}, 1), makeEvent('gtm.dom', {}, 2), makeEvent('gtm.load', {}, 3)],
      [tag], []
    )
    // gtm.js matches the All Pages trigger; gtm.dom/gtm.load don't.
    const fired = tagFiredSteps(steps, tag.tagId)
    expect(fired).toHaveLength(1)
    expect(fired[0].event.name).toBe('gtm.js')
  })

  it('returns an empty array for a tag that never fired', () => {
    const tag = makeTag({})
    const steps = runSimulation([makeEvent('gtm.js', {}, 1)], [tag], [])
    expect(tagFiredSteps(steps, tag.tagId)).toEqual([])
  })
})

describe('resolveVariable', () => {
  it('resolves a Constant variable from its own parameter', () => {
    const variable = makeVariable({ type: 'c', parameter: [{ type: 'template', key: 'value', value: 'AW-123456' }] })
    const result = resolveVariable(variable, {})
    expect(result).toMatchObject({ value: 'AW-123456', resolved: true })
  })

  it('resolves a Data Layer Variable by reading the named key out of the data layer', () => {
    const variable = makeVariable({ type: 'v', parameter: [{ type: 'template', key: 'name', value: 'orderValue' }] })
    expect(resolveVariable(variable, { orderValue: 49.99 })).toMatchObject({ value: 49.99, resolved: true })
    expect(resolveVariable(variable, {})).toMatchObject({ value: undefined, resolved: true })
  })

  it('resolves an Auto-Event Variable via the gtm.* key the simulator populates', () => {
    const variable = makeVariable({ type: 'aev', parameter: [{ type: 'template', key: 'varType', value: 'ELEMENT_CLASSES' }] })
    const result = resolveVariable(variable, { 'gtm.elementClasses': 'btn btn-primary' })
    expect(result).toMatchObject({ value: 'btn btn-primary', resolved: true })
  })

  it('leaves variable types that require a real page unresolved rather than guessing', () => {
    const domVariable = makeVariable({ type: 'd' })
    expect(resolveVariable(domVariable, {})).toMatchObject({ value: undefined, resolved: false })

    const jsVariable = makeVariable({ type: 'jsm' })
    expect(resolveVariable(jsVariable, {})).toMatchObject({ value: undefined, resolved: false })
  })
})
