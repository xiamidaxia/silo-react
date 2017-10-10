/* eslint-disable */
import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import { createSiloStore, Provider, connect } from '../src/'
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
