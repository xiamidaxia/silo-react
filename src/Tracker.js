let stackId = 0
export default class Tracker {
  constructor(rull, record, parent) {
    this.id = stackId++
    this.parent = parent
    this.rull = rull
    this.record = record || null
    this.depth = parent ? parent.depth + 1 : 0
  }
  add(path, type, method, args) {
    if (!this.rull) return this
    const record = this.rull({ path, type, method, args }, this)
    if (!record) return this
    return new Tracker(this.rull, record, this)
  }
  size() {
    return this.depth
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
