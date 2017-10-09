/* eslint-disable */
import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import { createSiloStore, Provider, connect } from '../src/'
import logger from '../src/logger'


if (process.env.NODE_ENV !== 'production') {
  createSiloStore = logger(createSiloStore)
}

const store = createSiloStore()

store.createPath('todos', {

})



ReactDOM.render(
  <Provider store={store}>
  </Provider>
)

ReactDOM.render(<Main />, document.getElementById('__content'))
