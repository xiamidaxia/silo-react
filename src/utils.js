const objKeys = Object.keys

export const reduce = (obj, fn, origin) => objKeys(obj).reduce((res, key) => fn(res, obj[key], key), origin)

export const mapValues = (obj, fn) => reduce(obj, (res, val, key) => Object.assign(res, { [key]: fn(val, key) }), {})

export function shallowEqual(objA, objB) {
  if (objA === objB) {
    return true
  }

  const keysA = Object.keys(objA)
  const keysB = Object.keys(objB)

  if (keysA.length !== keysB.length) {
    return false
  }

  // Test for A's keys different from B.
  const hasOwn = Object.prototype.hasOwnProperty
  for (let i = 0; i < keysA.length; i++) {
    if (!hasOwn.call(objB, keysA[i]) ||
      objA[keysA[i]] !== objB[keysA[i]]) {
      return false
    }
  }

  return true
}
