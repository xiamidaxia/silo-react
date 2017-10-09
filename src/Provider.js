import { Component, Children } from 'react'
import PropTypes from 'prop-types'

export const storeShape = PropTypes.shape({
  subscribe: PropTypes.func.isRequired,
  getPathMethods: PropTypes.func.isRequired,
  getState: PropTypes.func.isRequired,
})

function createProvider(storeKey = 'store') {
  class Provider extends Component {
    constructor(props, context) {
      super(props, context)
      this[storeKey] = props.store
    }
    getChildContext() {
      return { [storeKey]: this[storeKey] }
    }

    render() {
      return Children.only(this.props.children)
    }
  }

  Provider.propTypes = {
    store: storeShape.isRequired,
    children: PropTypes.element.isRequired,
  }
  Provider.childContextTypes = {
    [storeKey]: storeShape.isRequired,
  }

  return Provider
}

export default createProvider()
