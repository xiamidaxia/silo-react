import expect from 'expect'
import { createSiloStore, createStore, applyMiddleware } from '../index'
import { addTestPath, addEmptyPath } from './utils'

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
    expect(() => store.exec('set:test/abc')).toThrow(/Unknown set abc/)
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
    const store = applyMiddleware(middleware)(createSiloStore)()
    addTestPath(store)
    store.exec('set:test/noChange')
    store.exec('action:test/mulitiChange')
    store.exec('reset:test', { count: 0 })
    expect(times).toBe(5)
    const noChange = store.getPathMethods('test').setters.noChange
    noChange()
    expect(times).toBe(6)
  })
})
