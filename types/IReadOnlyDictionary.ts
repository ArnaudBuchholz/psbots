import type { Value } from '@api/values/Value.js';

/** A read-only collection of values indexed by a name */
export interface IReadOnlyDictionary {
  readonly names: string[];
  /** If the name does not exist, return NullValue */
  lookup: (name: string) => Value;
}

/** Enumerate IReadOnlyDictionary values */
export function* enumIDictionaryValues(dictionary: IReadOnlyDictionary): Generator<{
  name: string;
  value: Value;
}> {
  for (const name of dictionary.names) {
    const value = dictionary.lookup(name);
    yield { name, value };
  }
}

/** Returns an object containing all IReadOnlyDictionary values */
export function convertIDictionaryToObject(dictionary: IReadOnlyDictionary): { [key in string]: Value } {
  const result: { [key in string]: Value } = {};
  for (const { name, value } of enumIDictionaryValues(dictionary)) {
    result[name] = value;
  }
  return result;
}
