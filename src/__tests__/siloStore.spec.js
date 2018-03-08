import expect from 'expect'
import { createSiloStore, createStore, applyMiddleware } from '../index'
import { addTestPath, addEmptyPath } from './utils'

const trackerRule = ({ path, type, method }) => `${type}:${path}/${method}`

describe('createSiloStore', () => {
  it('as redux', () => {
    let success = false
    const { dispatch } = createSiloStore({}, (defaultReducer, initData) => createStore((store, action) => {
      if (action.type === 'customType') {
        success = true
        return store
      }
      return defaultReducer(store, action)
    }, initData))
    dispatch({ type: 'unknown' })
    dispatch({ type: 'customType' })
    expect(success).toBe(true)
  })
  it('create check', () => {
    expect(() => createSiloStore(3)).toThrow(/must be an object/)
    const store = createSiloStore()
    expect(() => store.getState('unknown')).toThrow(/Unknown path/)
    expect(() => store.exec('sit:nown')).toThrow(/Unknown exec key /)
    addTestPath(store)
    expect(() => store.exec('set:test')).toThrow(/Unknown set/)
    expect(() => store.exec('set:test/abc')).toThrow(/Unknown set:test\/abc/)
  })
  it('create and api', () => {
    const store = createSiloStore()
    addTestPath(store)
    addEmptyPath(store)
    let times = 0
    store.subscribe(() => {
      times++
    })
    expect(store.getState()).toEqual({ test: { count: 0 }, empty: {} })
    expect(() => addTestPath(store)).toThrow(/defined before/)
    expect(() => store.exec('set:test/unknown')).toThrow(/Unknown set/)
    store.exec('set:test/noChange')
    expect(times).toBe(1)
    store.exec('set:test/change', 1)
    expect(times).toBe(2)
    expect(store.getState('test').count).toBe(1)
    store.exec('action:test/mulitiChange')
    expect(store.getState('test').count).toBe(8)
    expect(times).toBe(5)
    store.exec('reset:test', { count: 0 })
    expect(times).toBe(6)
    expect(store.getState('test').count).toBe(0)
  })
  it('applyMiddleware', () => {
    let times = 0
    /* eslint-disable */
    const middleware = s => next => action => {
      times++
      return next(action)
    }
    const store = createSiloStore({}, applyMiddleware(middleware)(createStore))
    addTestPath(store)
    expect(times).toBe(1)
    store.exec('set:test/noChange')
    store.exec('action:test/mulitiChange')
    store.exec('reset:test', { count: 0 })
    expect(times).toBe(6)
    const noChange = store.getPathMethods('test').set.noChange
    noChange()
    expect(times).toBe(7)
  })
  it('injectArgs', () => {
    const context = {}
    const store = createSiloStore()
    store.createPath('test', {
      get: {
        getContext: ({ context }) => context
      },
      injectArgs(args) {
        return { ...args, context }
      },
    })
    expect(store.exec('get:test/getContext')).toBe(context)
  })
  it('tracker records', () => {
    const store = createSiloStore({}, undefined, trackerRule)
    store.createPath('myPath', {
      state: {
        tracker: null,
      },
      set: {
        set: ({ state, tracker }) => {
          return {
            ...state,
            tracker,
          }
        }
      },
      get: {
        get: ({ tracker }) => {
          return tracker
        }
      },
      action: {
        act1({ action }) {
          return action.act2()
        },
        act2({ action }) {
          return action.act3()
        },
        act3({ tracker, set }) {
          set.set()
          return tracker
        }
      },
    })
    const tracker = store.exec('action:myPath/act1')
    expect(tracker.records()).toEqual(
      ["action:myPath/act1", "action:myPath/act2", "action:myPath/act3"]
    )
    expect(tracker.parent.records()).toEqual(
      ["action:myPath/act1", "action:myPath/act2"]
    )
    expect(store.getState('myPath').tracker.records()).toEqual(
      ["action:myPath/act1", "action:myPath/act2", "action:myPath/act3", 'set:myPath/set']
    )
    expect(store.exec('get:myPath/get').records()).toEqual(
      ['get:myPath/get']
    )
  })
  it('onSet with tracker', () => {
    const store = createSiloStore({}, undefined, trackerRule)
    let targetStacks = []
    store.createPath('myPath', {
      set: {
        s1: ({ state }) => state,
        s2: ({ state }) => state,
      },
      action: {
        act1: ({ set }) => {
          set.s1()
          set.s2()
        },
      },
      onSet(payload) {
        targetStacks.push(payload.tracker)
      },
      tracker({ path, type, method }) {
        return `${type}:${path}/${method}`
      }
    })
    store.exec('action:myPath/act1')
    expect(targetStacks.map(stack => stack.records())).toEqual([
      ['action:myPath/act1', 'set:myPath/s1'],
      ['action:myPath/act1', 'set:myPath/s2'],
    ])
  })
})
