import reduxCreateStore from 'redux/lib/createStore'
import { batchedUpdates } from './batchedUpdates'
import { mapValues } from './utils'

export const SPLITER = '/'
export const ActionTypes = {
  UPDATE_PATH: '@@silo/PATH_UPDATE',
  INIT: '@@redux/INIT',
}
const execMap = {
  set: 'setters',
  reset: 'reset',
  get: 'getters',
  action: 'actions',
}

const defaultInjectArgsFn = () => {}

export default function createSiloStore(initData = {}, createStore = reduxCreateStore) {
  if (typeof initData !== 'object') {
    throw new Error('InitData must be an object.')
  }
  const methods = {}
  const settersMap = {}
  const actionsMap = {}
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
      getters: methods[path].getters,
    }
  }

  function updatePathReducer(store, { payload }) {
    return {
      ...store,
      [payload[0]]: payload[1],
    }
  }

  function siloReducer(store, action) {
    const { path, type } = normalizeType(action.type)
    if (!settersMap[path] || !settersMap[path][type]) {
      return store
    }
    const state = store[path]
    const newState = settersMap[path][type](getArgs(path), ...action.payload)
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
  function createStackActions(path, actions) {
    const injectStackArgs = (stack, parentAction) => {
      const injectArgs = getArgs(path, true)
      stack = stack.concat(parentAction)
      return {
        ...injectArgs,
        __actionStack: stack,
        actions: mapValues(actionsMap[path], (fn, name) => (...args) => batchedUpdates(() => fn(injectStackArgs(stack, name), ...args))),
      }
    }
    return mapValues(actions, (fn, name) => (...args) => batchedUpdates(() => fn(injectStackArgs([`${path}@${++stackId}`], name), ...args)))
  }

  // create redux store
  const { dispatch, getState, ...others } = createStore((store, action) => {
    switch (action.type) {
      case ActionTypes.UPDATE_PATH:
        return updatePathReducer(store, action)
      case ActionTypes.INIT:
        return store
      default:
        return siloReducer(store, action)
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
      if (set === 'reset') return this.dispatch({ type: ActionTypes.UPDATE_PATH, payload: [typeStr, args[0]] })
      const { path, type } = normalizeType(typeStr)
      assertPath(path)
      const fns = methods[path][execMap[set]]
      if (!fns[type]) throw new Error(`Unknown ${set} ${type} in ${path}.`)
      return fns[type](...args)
    },
    createPath(path, { initialState, getters = {}, setters = {}, actions = {} }) {
      if (methods[path]) throw new Error(`path ${path} is defined before.`)
      // Inline "this" for createMiddleware dispatch
      const currentDispatch = this.dispatch
      settersMap[path] = setters
      actionsMap[path] = actions
      methods[path] = {
        setters: mapValues(setters, (fn, key) => (...args) => currentDispatch({ type: `${path}${SPLITER}${key}`, payload: args })),
        getters: mapValues(getters, fn => (...args) => fn(getArgs(path), ...args)),
      }
      if (process.env.NODE_ENV !== 'production') {
        methods[path].actions = createStackActions(path, actions)
      } else {
        methods[path].actions = mapValues(actions, fn => (...args) => batchedUpdates(() => fn(getArgs(path, true), ...args)))
      }
      dispatch({
        type: ActionTypes.UPDATE_PATH,
        payload: [
          path,
          typeof initialState === 'function' ? initialState() : initialState,
        ],
      })
    },
  }
}

