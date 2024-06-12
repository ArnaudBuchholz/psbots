import type { IReadOnlyDictionary, Value } from '@api/index.js'
import { CompatibleValue, toValue } from './toValue.js'

export function toIReadOnlyDictionary (mapping: { [key in string]: CompatibleValue }): IReadOnlyDictionary {
  return {
    get names () {
      return Object.keys(mapping)
    },

    lookup (name: string): Value | null {
      const value = mapping[name]
      if (value === undefined) {
        return null
      }
      return toValue(value)
    }
  }
}
