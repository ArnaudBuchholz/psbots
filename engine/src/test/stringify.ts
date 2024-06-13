const known: Array<unknown> = [
  Math.PI,
  -Math.PI,
  Number.POSITIVE_INFINITY,
  Number.NEGATIVE_INFINITY
]

const stringified = [
  'π',
  '-π',
  '∞',
  '-∞'
]

export function stringify (value: unknown): string {
  if (typeof value === 'function') {
    return value.toString()
  }
  return stringified[known.indexOf(value)] ?? JSON.stringify(value)
}
