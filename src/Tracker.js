let stackId = 0
const emptyRecord = record => record === undefined || record === null

export default class Tracker {
  constructor(rule, record, parent) {
    this.id = stackId++
    this.parent = parent || null
    this.rootTracker = parent ? parent.rootTracker : this
    this.rule = rule
    this.record = record
    this.depth = parent ? parent.depth + 1 : 0
  }
  add(data) {
    if (!this.rule) return this
    const record = this.rule(data, this)
    if (emptyRecord(record)) return this
    return new Tracker(this.rule, record, this)
  }
  length() {
    return (emptyRecord(this.rootTracker.record) ? 0 : 1) + this.depth
  }
  isRoot() {
    return !this.parent
  }
  records() {
    const records = []
    let tracker = this
    while (tracker && tracker.record) {
      records.push(tracker.record)
      tracker = tracker.parent
    }
    return records.reverse()
  }
}
