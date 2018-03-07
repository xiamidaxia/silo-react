import Tracker from '../Tracker'

it('tracker create', () => {
  const tracker = new Tracker()
  expect(tracker.rootTracker).toEqual(tracker)
  expect(tracker.parent).toEqual(null)
})
it('tracker length', () => {
  const emptyTracker = new Tracker()
  const emptyWithRull = new Tracker(() => 'a')
  const tracker = new Tracker(() => 'a', 'a')
  expect(emptyTracker.length()).toEqual(0)
  expect(tracker.length()).toEqual(1)
  expect(tracker.add('xxxx').length()).toEqual(2)
  expect(emptyTracker.add('xxxx').length()).toEqual(0)
  expect(emptyWithRull.add('xxxx').length()).toEqual(1)
})
