# Silo-React

React state manager based on redux

[![NPM version](https://img.shields.io/npm/v/silo-react.svg?style=flat)](https://npmjs.org/package/silo-react)
[![Build Status](https://img.shields.io/travis/xiamidaxia/silo-react.svg?style=flat)](https://travis-ci.org/xiamidaxia/silo-react)
[![Coverage Status](https://img.shields.io/coveralls/xiamidaxia/silo-react.svg?style=flat)](https://coveralls.io/r/xiamidaxia/silo-react)
[![NPM downloads](http://img.shields.io/npm/dm/silo-react.svg?style=flat)](https://npmjs.org/package/silo-react)
[![Dependencies](https://david-dm.org/xiamidaxia/silo-react/status.svg)](https://david-dm.org/xiamidaxia/silo-react)

## Quick start

```jsx harmony
import { createSiloStore, Provider, connect } from 'silo-react'
const store = createSiloStore()

store.createPath('todos', {
  initialState() {
    return {
      list: [],
    }
  },
  get: {
    count: ({ state }) => state.list.length,
  },
  set: {
    add({ state }) {
      return {
        ...state,
        list: state.list.concat({ title: `todo title ${state.list.length + 1}`, id: state.list.length })
      }
    }
  },
  action: {
    async fetchList({ set }) {
      return new Promise(res => setTimeout(() => set.add()), 10)
    }
  },
})

class Todos extends React.Component {
  componentDidMount() {
    this.props.action.fetchList()
  }
  render() {
    return <div>
      <h2>Todos ({this.props.get.count()})</h2>
      <ul>{this.props.state.list.map(item => <li key={item.id}>{item.title}</li>)}</ul>
      <button onClick={() => this.props.set.add()}>Add</button>
    </div>
  }
}
const TodoContainer = connect('todos')(Todos)

ReactDOM.render(
  <Provider store={store}>
    <TodoContainer />
  </Provider>
, document.getElementById('__content'))
```

## Redux Middleware

```jsx harmony
const logger = s => next => action => {
  console.log(action)
  return next(action)
}
const store = createSiloStore({}, applyMiddleware(logger)(createStore))
```

## Global exec path methods

```jsx harmony
store.getState('todos') // Get "todos" state
store.exec('action:todos/fetchList', ...params) // exec action with params
store.exec('get:todos/count', ...params) // exec get
store.exec('set:todos/add', ...params) // exec set
```

## Action stack in development

```jsx harmony
const store = createSiloStore()
store.createPath('myPath', {
  action: {
    act1({ action }) {
      return action.act2()
    },
    act2({ action }) {
      return action.act3()
    },
    act3({ trackerStack }) {
      return trackerStack.stack
    }
  },
  tracker({ path, type, method }) {
    return `${type}:${path}/${method}`
  }
})
expect(store.exec('action:myPath/act1')).toEqual(["action:myPath/act1", "action:myPath/act2", "action:myPath/act3"])
```

## Inject context arguments

```jsx
const store = createSiloStore()

store.createPath('myPath', {
  action: {
    act({ myContext }) {
       console.log(myContext) // my context
    }
  },
  injectArgs() {
    return {
      myContext: { /* my context */}
    }
  },
})
```