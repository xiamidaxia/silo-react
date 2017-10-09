# Silo-React

React state manager based on redux

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
  getters: {
    getCount: ({ state }) => state.list.length,
  },
  setters: {
    add({ state }) {
      return {
        ...state,
        list: state.list.concat({ title: `todo title ${state.list.length + 1}`, id: state.list.length })
      }
    }
  },
  actions: {
    async fetchList({ setters }) {
      return new Promise(res => setTimeout(() => setters.add()), 10)
    }
  },
})

class Todos extends React.Component {
  componentDidMount() {
    this.props.actions.fetchList()
  }
  render() {
    return <div>
      <h2>Todos ({this.props.getters.getCount()})</h2>
      <ul>{this.props.state.list.map(item => <li key={item.id}>{item.title}</li>)}</ul>
      <button onClick={() => this.props.setters.add()}>Add</button>
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
const store = applyMiddleware(logger)(createSiloStore)()
```

## Action stack in development

```jsx harmony
const store = createSiloStore()
store.createPath('myPath', {
  actions: {
    act1({ actions }) {
      return actions.act2()
    },
    act2({ actions }) {
      return actions.act3()
    },
    act3({ __actionStack }) {
      return __actionStack
    }
  }
})
expect(store.exec('action:myPath/act1')).toEqual(['myPath', 'act1', 'act2', 'act3'])
```
