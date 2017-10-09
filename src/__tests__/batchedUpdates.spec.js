import { readyToPerform, batchedUpdates } from '../batchedUpdates'

/* eslint-disable */
describe('batchedUpdates', () => {
  let data = 0
  let times = 0
  const render = () => {
    if (render.data !== data) {
      times++
    }
    render.data = data
  }
  const change = () => {
    data++
    render()
  }
  const readyChange = () => {
    data++
    readyToPerform(render)
  }
  beforeEach(() => {
    data = 0
    times = 0
  })
  it('simple', () => {
    change()
    readyChange()
    expect(times).toBe(2)
    batchedUpdates(() => {
      readyChange()
      readyChange()
    })
    expect(times).toBe(3)
  })
  it('nested', () => {
    batchedUpdates(() => {
      readyChange()
      readyChange()
      batchedUpdates(() => {
        readyChange()
        readyChange()
        batchedUpdates(() => {
          readyChange()
          readyChange()
        })
      })
    })
    expect(times).toBe(1)
  })
  it('error', () => {
    const err = new Error('batched')
    try {
      batchedUpdates(() => {
        readyChange()
        throw err
        readyChange()
      })
    } catch (e) {
      expect(e).toBe(err)
    } finally {
      expect(times).toBe(1)
    }
    try {
      batchedUpdates(() => {
        readyChange()
        batchedUpdates(() => {
          readyChange()
          readyChange()
          throw err
          batchedUpdates(() => {
            readyChange()
            readyChange()
          })
        })
      })
    } catch (e) {
      expect(e).toBe(err)
    } finally {
      expect(times).toBe(2)
    }
  })
})
