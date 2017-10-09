import React from 'react'
import renderer from 'react-test-renderer'
import { createSiloStore, connect, Provider } from '../index'
import { addTestPath } from './utils'

describe('connect', () => {
  it('create connect', () => {
    const Demo = connect('test')(({ state, getters, setters }) => (
      <div>
        <span>count: {state.count}: {getters.getCount()}</span>
        <button onClick={() => setters.change()}>button</button>
      </div>
    ))
    const store = createSiloStore()
    addTestPath(store)
    const component = renderer.create(
      <Provider store={store}>
        <Demo />
      </Provider>
    )
    const tree = component.toJSON()
    expect(tree).toMatchSnapshot()
    tree.children[1].props.onClick()
    expect(component.toJSON()).toMatchSnapshot()
  })
  it('connect update', () => {
    let renderTimes = 0
    const Demo = connect('test')(() => {
      renderTimes++
      return <div>demo</div>
    })
    const store = createSiloStore()
    addTestPath(store)
    const component = renderer.create(
      <Provider store={store}>
        <Demo />
      </Provider>
    )
    expect(renderTimes).toBe(1)
    store.exec('set:test/noChange')
    expect(renderTimes).toBe(1)
    store.exec('set:test/change')
    store.exec('set:test/change')
    expect(renderTimes).toBe(3)
    store.exec('action:test/mulitiChange')
    expect(renderTimes).toBe(4)
    component.unmount()
    store.exec('set:test/change')
    expect(renderTimes).toBe(4)
  })
})
