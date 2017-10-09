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
