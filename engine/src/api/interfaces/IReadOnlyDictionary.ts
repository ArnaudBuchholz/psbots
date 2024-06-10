import { Value } from '@api/values/Value.js'

/** A read-only collection of values indexed by a name */
export interface IReadOnlyDictionary {
  readonly names: string[]
  /** If the name does not exist, return null */
  lookup: (name: string) => Value | null
}
