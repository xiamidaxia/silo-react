import React, { Component } from 'react'
import hoistStatics from 'hoist-non-react-statics'
import { readyToPerform } from './batchedUpdates'
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
        this.storeMethods = this.siloStore.getPathMethods(path)
      }
      componentWillMount() {
        this.trySubscribe()
      }
      componentWillUnmount() {
        this.tryUnsubscribe()
        this.storeMethods = null
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
        const props = mergeToPropsFn({
          state: this.state.storeState,
          ...this.storeMethods,
        }, this.props)
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
