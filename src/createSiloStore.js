import reduxCreateStore from 'redux/lib/createStore'
import { batchedUpdates } from './batchedUpdates'
import { mapValues } from './utils'
import Tracker from './Tracker'

export const SPLITER = '/'
export const ActionTypes = {
  RESET_PATH: '@@silo/PATH_RESET',
  INIT_PATH: '@@silo/PATH_INIT',
  SET_PATH: '@@silo/PATH_SET',
  INIT: '@@redux/INIT',
}
const execKeys = ['set', 'reset', 'get', 'action']
const defaultInjectArgsFn = args => args
const defaultTrackerRule = () => {}

/* eslint-disable no-use-before-define */
export default function createSiloStore(initData = {}, createStore = reduxCreateStore, trackerRule = defaultTrackerRule) {
  if (typeof initData !== 'object') {
    throw new Error('InitData must be an object.')
  }
  const methods = {}

  function assertPath(path) {
    if (!methods[path]) throw new Error(`Unknown path ${path}.`)
  }

  function normalizeType(str) {
    str = str.split(SPLITER)
    if (str.length === 1) {
      return {
        path: str.join(SPLITER),
        method: '',
      }
    }
    return {
      path: str.slice(0, -1).join(SPLITER),
      method: str[str.length - 1],
    }
  }

  function updatePathReducer(store, { payload }) {
    return {
      ...store,
      [payload.path]: payload.state,
    }
  }

  function siloReducer(store, action) {
    const { path, method, args, tracker } = action.payload
    const state = store[path]
    const newState = methods[path].set[method](getArgs(path, tracker), ...args)
    // check state
    if (state !== newState) {
      store = {
        ...store,
        [path]: newState,
      }
    }
    return store
  }

  function trackerAdd(tracker, record) {
    return tracker ? tracker.add(record) : new Tracker(trackerRule, trackerRule(record))
  }

  function execMethod(path, fn, key, tracker, type) {
    return execMap[type](path, fn, key, tracker)
  }

  function getArgs(path, tracker, all) {
    const currentMethods = methods[path]
    const args = {
      tracker,
      state: getState()[path],
      get: mapValues(currentMethods.get, (fn, key) => execMap.get(path, fn, key, tracker)),
    }
    if (all) {
      args.set = mapValues(currentMethods.set, (fn, key) => execMap.set(path, fn, key, tracker))
      args.action = mapValues(currentMethods.action, (fn, key) => execMap.action(path, fn, key, tracker))
    }
    return methods[path].injectArgs(args)
  }

  // create redux store
  const { dispatch, getState, ...others } = createStore((store, action) => {
    switch (action.type) {
      case ActionTypes.INIT_PATH:
      case ActionTypes.RESET_PATH:
        return updatePathReducer(store, action)
      case ActionTypes.SET_PATH:
        return siloReducer(store, action)
      default:
        return store
    }
  }, initData)

  const execMap = {
    set(path, fn, method, injectTracker) {
      const { onSet } = methods[path]
      return (...args) => {
        const tracker = trackerAdd(injectTracker, { path, method, type: 'set', args })
        const payload = { path, method, args, tracker }
        const res = dispatch({ type: ActionTypes.SET_PATH, payload })
        if (onSet) onSet(payload)
        return res
      }
    },
    get(path, fn, method, injectTracker) {
      return (...args) => {
        const tracker = trackerAdd(injectTracker, { path, method, type: 'get', args })
        return fn(getArgs(path, tracker), ...args)
      }
    },
    action(path, fn, method, injectTracker) {
      return (...args) => batchedUpdates(() => {
        const tracker = trackerAdd(injectTracker, { path, method, type: 'action', args })
        return fn(getArgs(path, tracker, true), ...args)
      })
    },
  }

  return {
    ...others,
    getState(path) {
      if (!path) return getState()
      assertPath(path)
      return getState()[path]
    },
    dispatch,
    getRenderArgsFn(path) {
      const currentMethods = methods[path]
      const propsCache = {
        get: mapValues(currentMethods.get, (fn, key) => execMap.get(path, fn, key)),
        set: mapValues(currentMethods.set, (fn, key) => execMap.set(path, fn, key)),
        action: mapValues(currentMethods.action, (fn, key) => execMap.action(path, fn, key)),
      }
      return () => currentMethods.injectArgs({ ...propsCache, state: getState()[path] })
    },
    /**
     * @param {String} str like 'set:todos/addItem'
     * @param args
     * @returns {*}
     */
    exec(str, ...args) {
      let tracker
      if (args[0] instanceof Tracker) {
        tracker = args.shift()
      }
      const [key, typeStr] = str.split(':')
      if (execKeys.indexOf(key) === -1) throw new Error(`Unknown exec key ${key}.`)
      if (key === 'reset') return dispatch({ type: ActionTypes.RESET_PATH, payload: { path: typeStr, state: args[0] } })
      const { path, method } = normalizeType(typeStr)
      assertPath(path)
      const fn = methods[path][key][method]
      if (!fn) throw new Error(`Unknown ${key}:${path}/${method}.`)
      return execMethod(path, fn, method, tracker, key)(...args)
    },
    createPath(path, { initialState, get = {}, set = {}, onSet, action = {}, injectArgs = defaultInjectArgsFn }) {
      if (methods[path]) throw new Error(`path ${path} is defined before.`)
      methods[path] = { set, get, action, onSet, injectArgs }
      dispatch({
        type: ActionTypes.INIT_PATH,
        payload: {
          path,
          state: typeof initialState === 'function' ? initialState() : initialState,
        },
      })
    },
  }
}

