let isStart = false
const performCache = []

function tryUpdate() {
  if (isStart && performCache.length > 0) {
    try {
      performCache.forEach(fn => fn())
    } finally {
      performCache.length = 0
    }
  }
}

export function readyToPerform(fn) {
  if (!isStart) {
    fn()
    return
  }
  performCache.push(fn)
}

export function batchedUpdates(func) {
  let result
  // tryUpdate()
  isStart = true
  try {
    result = func()
  } finally {
    tryUpdate()
    isStart = false
  }
  return result
}
