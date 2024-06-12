import type { IReadOnlyArray, Value } from '@api/index.js'
import { CompatibleValue, toValue } from './toValue.js'

export function toIReadOnlyArray (values: CompatibleValue[]): IReadOnlyArray {
  return {
    get length () {
      return values.length
    },

    at (index): Value | null {
      const value = values[index]
      if (value === undefined) {
        return null
      }
      return toValue(value)
    }
  }
}
