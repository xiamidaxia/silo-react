/* eslint-disable */
import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import { createSiloStore, Provider, connect } from '../src/'

const store = createSiloStore()


ReactDOM.render(
  <Provider store={store}>
  </Provider>
)

ReactDOM.render(<Main />, document.getElementById('__content'))
