import React from 'react'
import renderer from 'react-test-renderer'
import { createSiloStore, connect, Provider } from '../index'
import { addTestPath } from './utils'

describe('connect', () => {
  it('create connect', () => {
    const Demo = connect('test')(({ state, get, set }) => (
      <div>
        <span>count: {state.count}/{get.getCount()}</span>
        <button onClick={() => set.change()}>button</button>
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
  it('connect nested', () => {
    const Demo = connect('test1')(({ state, set, parentCount }) => (
      <div>
        <span>count: {parentCount}/{state.count}</span>
        <button onClick={() => set.change()}>button</button>
      </div>
    ))
    const Demo2 = connect('test2')(({ state, set }) => (
      <div>
        { state.count === 2 ? null : <Demo parentCount={state.count} /> }
        <button onClick={() => set.change()}>button</button>
      </div>
    ))
    const store = createSiloStore()
    addTestPath(store, 'test1')
    addTestPath(store, 'test2')
    const component = renderer.create(
      <Provider store={store}>
        <Demo2 />
      </Provider>
    )
    const tree = component.toJSON()
    expect(tree).toMatchSnapshot()
    tree.children[1].props.onClick()
    expect(component.toJSON()).toMatchSnapshot()
    tree.children[1].props.onClick()
    expect(component.toJSON()).toMatchSnapshot()
  })
})
