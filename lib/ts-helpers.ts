
export type NonEmptyArray<T> = [T, ...T[]]

export function checkNonEmptyArray<T> (array: T[], fail: () => never = () => { throw new Error() }): asserts array is NonEmptyArray<T> {
  if (array.length === 0) {
    fail()
  }
}

export const getKeys = Object.keys as <T extends object>(obj: T) => Array<keyof T>

export function isObject (value: unknown): value is any {
  return typeof value === 'object' && value !== null
}
