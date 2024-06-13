export function isObject (value: unknown): value is any {
  return typeof value === 'object' && value !== null
}
