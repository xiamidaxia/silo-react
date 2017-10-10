export function addTestPath(store, name = 'test') {
  store.createPath(name, {
    initialState: () => ({ count: 0 }),
    get: {
      getCount: ({ state }) => state.count,
    },
    action: {
      mulitiChange({ set, get }) {
        set.change(get.getCount())
        set.change(get.getCount())
        set.change(get.getCount())
      },
    },
    set: {
      noChange({ state }) {
        return state
      },
      change({ state }, count = 1) {
        return {
          ...state,
          count: state.count + count,
        }
      },
    },
  })
}

export function addEmptyPath(store) {
  store.createPath('empty', {
    initialState: {},
  })
}
