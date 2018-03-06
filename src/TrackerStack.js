let stackId = 0
export default class TrackerStack {
  constructor(rull, stack = [], parent) {
    this.id = stackId++
    this.parent = parent
    this.rull = rull
    this.stack = stack
  }
  add(path, type, method, args) {
    if (!this.rull) return this
    const item = this.rull({ path, type, method, args }, this)
    if (!item) return this
    return new TrackerStack(this.rull, this.stack.concat(item), this)
  }
  size() {
    return this.stack.length
  }
}
