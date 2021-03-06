import React, { Component } from 'react'
import hoistStatics from 'hoist-non-react-statics'
import { readyToPerform } from './batchedUpdates'
import { shallowEqual } from './utils'
import { storeShape } from './Provider'

function getDisplayName(WrappedComponent) {
  return WrappedComponent.displayName || WrappedComponent.name || 'Component'
}

function defaultMergeToProps(stateProps, parentProps) {
  return {
    ...stateProps,
    ...parentProps,
  }
}

export default function connect(path, mergeToProps, siloStore) {
  const mergeToPropsFn = mergeToProps || defaultMergeToProps
  return function connectWrap(WrappedComponent) {
    const connectDisplayName = `Connect(${getDisplayName(WrappedComponent)})`
    class Connect extends Component {
      constructor(props, context) {
        super(props, context)
        this.siloStore = siloStore || context.store
        this.state = {
          storeState: this.siloStore.getState(path),
        }
        this.getRenderArgs = this.siloStore.getRenderArgsFn(path)
      }
      componentWillMount() {
        this.trySubscribe()
      }
      shouldComponentUpdate(nextProps, state) {
        return state.storeState !== this.state.storeState || !shallowEqual(nextProps, this.props)
      }
      componentWillUnmount() {
        this.tryUnsubscribe()
      }
      trySubscribe() {
        if (!this.unsubscribe) {
          this.unsubscribe = this.siloStore.subscribe(this.handleChange.bind(this))
        }
      }
      tryUnsubscribe() {
        if (this.unsubscribe) {
          this.unsubscribe()
          this.unsubscribe = null
        }
      }
      handleChange() {
        if (this.isStateChanged(this.siloStore.getState(path))) {
          this.readyToPerformUpdate()
        }
      }
      isStateChanged(newState) {
        return newState !== this.state.storeState
      }
      readyToPerformUpdate() {
        if (this.isBatchingUpdatesAddded) return
        this.isBatchingUpdatesAddded = true
        readyToPerform(() => {
          this.isBatchingUpdatesAddded = false
          const storeState = this.siloStore.getState(path)
          if (this.isStateChanged(storeState)) {
            this.setState({ storeState })
          }
        })
      }
      render() {
        const props = mergeToPropsFn(this.getRenderArgs(), this.props)
        return <WrappedComponent {...props} />
      }
    }
    Connect.displayName = connectDisplayName
    Connect.WrappedComponent = WrappedComponent
    Connect.contextTypes = {
      store: storeShape,
    }
    return hoistStatics(Connect, WrappedComponent)
  }
}
