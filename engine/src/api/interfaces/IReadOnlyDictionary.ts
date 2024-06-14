import type { Value } from '@api/values/Value.js';

/** A read-only collection of values indexed by a name */
export interface IReadOnlyDictionary {
  readonly names: string[];
  /** If the name does not exist, return null */
  lookup: (name: string) => Value | null;
}

/** Enumerate IReadOnlyDictionary values */
export function* enumIDictionaryValues(iDictionary: IReadOnlyDictionary): Generator<{
  name: string;
  value: Value;
}> {
  for (const name of iDictionary.names) {
    const value = iDictionary.lookup(name);
    if (value !== null) {
      yield { name, value };
    }
  }
}

/** Returns an object containing all IReadOnlyDictionary values */
export function convertIDictionaryToObject(iDictionary: IReadOnlyDictionary): { [key in string]: Value } {
  const result: { [key in string]: Value } = {};
  for (const { name, value } of enumIDictionaryValues(iDictionary)) {
    result[name] = value;
  }
  return result;
}
