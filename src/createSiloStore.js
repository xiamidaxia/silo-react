import reduxCreateStore from 'redux/lib/createStore'
import { batchedUpdates } from './batchedUpdates'
import { mapValues } from './utils'
import TrackerStack from './TrackerStack'

export const SPLITER = '/'
export const ActionTypes = {
  RESET_PATH: '@@silo/PATH_RESET',
  INIT_PATH: '@@silo/PATH_INIT',
  SET_PATH: '@@silo/PATH_SET',
  INIT: '@@redux/INIT',
}
const execKeys = ['set', 'reset', 'get', 'action']
const defaultInjectArgsFn = args => args

/* eslint-disable no-use-before-define */
export default function createSiloStore(initData = {}, createStore = reduxCreateStore) {
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
    const { path, key, args, trackerStack } = action.payload
    const state = store[path]
    const newState = methods[path].set[key](getArgs(path, trackerStack), ...args)
    // check state
    if (state !== newState) {
      store = {
        ...store,
        [path]: newState,
      }
    }
    return store
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
    set(path, fn, key, trackerStack) {
      trackerStack = trackerStack || methods[path].tracker
      return (...args) => dispatch({ type: ActionTypes.SET_PATH, payload: { path, key, args, trackerStack: trackerStack.add(path, 'set', key, args) } })
    },
    get(path, fn, key, trackerStack) {
      trackerStack = trackerStack || methods[path].tracker
      return (...args) => fn(getArgs(path, trackerStack.add(path, 'get', key, args)), ...args)
    },
    action(path, fn, key, trackerStack) {
      trackerStack = trackerStack || methods[path].tracker
      return (...args) => batchedUpdates(() => fn(getArgs(path, trackerStack.add(path, 'action', key, args), true), ...args))
    },
  }

  function execMethod(path, fn, key, trackerStack, type) {
    return execMap[type](path, fn, key, trackerStack)
  }

  function getArgs(path, trackerStack, all) {
    const args = {
      trackerStack,
      state: getState()[path],
      get: mapValues(methods[path].get, (fn, key) => execMap.get(path, fn, key, trackerStack)),
    }
    if (all) {
      args.set = mapValues(methods[path].set, (fn, key) => execMap.set(path, fn, key, trackerStack))
      args.action = mapValues(methods[path].action, (fn, key) => execMap.action(path, fn, key, trackerStack))
    }
    return methods[path].injectArgs(args)
  }

  return {
    ...others,
    getState(path) {
      if (!path) return getState()
      assertPath(path)
      return getState()[path]
    },
    dispatch,
    getPathMethods(path) {
      assertPath(path)
      const pathMethods = methods[path]
      return {
        get: mapValues(pathMethods.get, (fn, key) => execMap.get(path, fn, key, pathMethods.stack)),
        set: mapValues(pathMethods.set, (fn, key) => execMap.set(path, fn, key, pathMethods.stack)),
        action: mapValues(pathMethods.action, (fn, key) => execMap.action(path, fn, key, pathMethods.stack)),
      }
    },
    /**
     * @param {String} str like 'set:todos/addItem'
     * @param {TrackerStack} stack
     * @param args
     * @returns {*}
     */
    exec(str, stack, ...args) {
      if (stack && !(stack instanceof TrackerStack)) {
        args.unshift(stack)
        stack = null
      }
      const [key, typeStr] = str.split(':')
      if (execKeys.indexOf(key) === -1) throw new Error(`Unknown exec key ${key}.`)
      if (key === 'reset') return dispatch({ type: ActionTypes.RESET_PATH, payload: { path: typeStr, state: args[0] } })
      const { path, method } = normalizeType(typeStr)
      assertPath(path)
      const fn = methods[path][key][method]
      if (!fn) throw new Error(`Unknown ${key}:${path}/${method}.`)
      return execMethod(path, fn, method, stack, key)(...args)
    },
    createPath(path, { initialState, get = {}, set = {}, action = {}, injectArgs = defaultInjectArgsFn, tracker }) {
      if (methods[path]) throw new Error(`path ${path} is defined before.`)
      methods[path] = { set, get, action, tracker: new TrackerStack(tracker), injectArgs }
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

