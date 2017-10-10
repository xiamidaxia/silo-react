export function addTestPath(store, name = 'test') {
  store.createPath(name, {
    initialState: () => ({ count: 0 }),
    getters: {
      getCount: ({ state }) => state.count,
    },
    actions: {
      mulitiChange({ setters, getters }) {
        setters.change(getters.getCount())
        setters.change(getters.getCount())
        setters.change(getters.getCount())
      },
    },
    setters: {
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
