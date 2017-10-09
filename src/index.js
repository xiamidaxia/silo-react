import applyMiddleware from 'redux/lib/applyMiddleware'
import createStore from 'redux/lib/createStore'
import compose from 'redux/lib/compose'
import createSiloStore from './createSiloStore'
import connect from './connect'
import Provider from './Provider'

export {
  createSiloStore,
  createStore,
  applyMiddleware,
  compose,
  connect,
  Provider,
}
