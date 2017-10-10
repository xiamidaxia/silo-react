import reduxCreateStore from 'redux/lib/createStore'
import { batchedUpdates } from './batchedUpdates'
import { mapValues } from './utils'

export const SPLITER = '/'
export const ActionTypes = {
  UPDATE_PATH: '@@silo/PATH_UPDATE',
  SET_PATH: '@@silo/PATH_SET',
  INIT: '@@redux/INIT',
}
const execMap = {
  set: 'set',
  reset: 'reset',
  get: 'get',
  action: 'action',
}

const defaultInjectArgsFn = () => {}

export default function createSiloStore(initData = {}, createStore = reduxCreateStore) {
  if (typeof initData !== 'object') {
    throw new Error('InitData must be an object.')
  }
  const methods = {}
  const setMap = {}
  const actionMap = {}
  let injectArgsFn = defaultInjectArgsFn
  function assertPath(path) {
    if (!methods[path]) throw new Error(`Unknown path ${path}.`)
  }
  function normalizeType(str) {
    str = str.split(SPLITER)
    if (str.length === 1) {
      return {
        path: str.join(SPLITER),
        type: '',
      }
    }
    return {
      path: str.slice(0, -1).join(SPLITER),
      type: str[str.length - 1],
    }
  }

  function getArgs(path, all) {
    /* eslint-disable no-use-before-define */
    return all ? {
      ...injectArgsFn(path),
      state: getState()[path],
      ...methods[path],
    } : {
      ...injectArgsFn(path),
      state: getState()[path],
      get: methods[path].get,
    }
  }

  function updatePathReducer(store, { payload }) {
    return {
      ...store,
      [payload.path]: payload.state,
    }
  }

  function siloReducer(store, action) {
    const { path, setter, args, injectedArgs } = action.payload
    assertPath(path)
    if (!setMap[path][setter]) {
      throw new Error(`Unknown setter "${setter}" in ${path}.`)
    }
    const state = store[path]
    const newState = setMap[path][setter](injectedArgs, ...args)
    // check state
    if (state !== newState) {
      store = {
        ...store,
        [path]: newState,
      }
    }
    return store
  }

  let stackId = 0
  function createStackActions(path, action, currentDispatch) {
    const injectStackArgs = (stack, parentAction, all) => {
      const injectArgs = getArgs(path, all)
      stack = stack.concat(parentAction)
      if (all) {
        return {
          ...injectArgs,
          __actionStack: stack,
          set: mapValues(setMap[path], (fn, setter) => (...args) => currentDispatch({ type: ActionTypes.SET_PATH, payload: { path, setter, args, injectedArgs: injectStackArgs(stack, setter) } })),
          action: mapValues(actionMap[path], (fn, name) => (...args) => batchedUpdates(() => fn(injectStackArgs(stack, name, true), ...args))),
        }
      }
      return {
        ...injectArgs,
        __actionStack: stack,
      }
    }
    return mapValues(action, (fn, name) => (...args) => batchedUpdates(() => fn(injectStackArgs([`${path}@${++stackId}`], name, true), ...args)))
  }

  // create redux store
  const { dispatch, getState, ...others } = createStore((store, action) => {
    switch (action.type) {
      case ActionTypes.UPDATE_PATH:
        return updatePathReducer(store, action)
      case ActionTypes.SET_PATH:
        return siloReducer(store, action)
      default:
        return store
    }
  }, initData)

  return {
    ...others,
    getState(path) {
      if (!path) return getState()
      assertPath(path)
      return getState()[path]
    },
    dispatch,
    injectArgs(newInjectArgsFn) {
      injectArgsFn = newInjectArgsFn
    },
    getPathMethods(path) {
      assertPath(path)
      return methods[path]
    },
    /**
     * @param {String} name like 'set:todos/addItem'
     * @param args
     * @returns {*}
     */
    exec(str, ...args) {
      const [set, typeStr] = str.split(':')
      if (!execMap[set]) throw new Error(`Unknown exec key ${set}.`)
      // Inline "this" for the createMiddleware dispatch
      if (set === 'reset') return this.dispatch({ type: ActionTypes.UPDATE_PATH, payload: { path: typeStr, state: args[0] } })
      const { path, type } = normalizeType(typeStr)
      assertPath(path)
      const fns = methods[path][execMap[set]]
      if (!fns[type]) throw new Error(`Unknown ${set} ${type} in ${path}.`)
      return fns[type](...args)
    },
    createPath(path, { initialState, get = {}, set = {}, action = {} }) {
      if (methods[path]) throw new Error(`path ${path} is defined before.`)
      // Inline "this" for createMiddleware dispatch
      const currentDispatch = this.dispatch
      setMap[path] = set
      actionMap[path] = action
      methods[path] = {
        set: mapValues(set, (fn, setter) => (...args) => currentDispatch({ type: ActionTypes.SET_PATH, payload: { path, setter, args, injectedArgs: getArgs(path) } })),
        get: mapValues(get, fn => (...args) => fn(getArgs(path), ...args)),
      }
      if (process.env.NODE_ENV !== 'production') {
        methods[path].action = createStackActions(path, action, currentDispatch)
      } else {
        methods[path].action = mapValues(action, fn => (...args) => batchedUpdates(() => fn(getArgs(path, true), ...args)))
      }
      dispatch({
        type: ActionTypes.UPDATE_PATH,
        payload: {
          path,
          state: typeof initialState === 'function' ? initialState() : initialState,
        },
      })
    },
  }
}

