const objKeys = Object.keys

export const reduce = (obj, fn, origin) => objKeys(obj).reduce((res, key) => fn(res, obj[key], key), origin)

export const mapValues = (obj, fn) => reduce(obj, (res, val, key) => Object.assign(res, { [key]: fn(val, key) }), {})
