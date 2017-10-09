import React, { Component } from 'react'
import ReactDOM from 'react-dom'

/* eslint-disable */
export default class Main extends Component {
  static propTypes = {
  }
  render() {
    return (
      <div className="container">
        Hello World!
      </div>
    )
  }
}

ReactDOM.render(<Main />, document.getElementById('__content'))
