import { describe, expect, it } from 'vitest'
import type { GtmTag, GtmTrigger } from '../../src/lib/gtm'
import {
  PAGE_LOAD_EVENTS,
  evaluateTag,
  eventLabel,
  resolveTriggers,
  runSimulation,
  triggerMatchesEvent,
  type SimEvent,
} from '../../src/features/preview/lib/simulator'

function makeTag(overrides: Partial<GtmTag>): GtmTag {
  return { tagId: 't1', name: 'Test tag', type: 'ga4Event', path: '', ...overrides }
}

function makeTrigger(overrides: Partial<GtmTrigger>): GtmTrigger {
  return { triggerId: 'tr1', name: 'Test trigger', type: 'pageview', path: '', ...overrides }
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
