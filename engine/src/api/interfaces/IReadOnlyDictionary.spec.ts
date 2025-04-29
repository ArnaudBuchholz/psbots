import { describe, it, expect } from 'vitest';
import type { Value } from '@api/index.js';
import { enumIDictionaryValues, convertIDictionaryToObject } from '@api/index.js';
import { toValue } from '@test/index.js';

const readOnlyDictionary = toValue({ a: 1, b: 2, c: '3' }, { isReadOnly: true }).dictionary;

describe('enumIDictionaryValues', () => {
  it('returns a generator', () => {
    const generator = enumIDictionaryValues(readOnlyDictionary);
    expect(generator.next).toBeInstanceOf(Function);
  });

  it('returns all values of the dictionary', () => {
    expect([...enumIDictionaryValues(readOnlyDictionary)]).toStrictEqual<{ name: string; value: Value }[]>([
      {
        name: 'a',
        value: {
          type: 'integer',
          isReadOnly: true,
          isExecutable: false,

          integer: 1
        }
      },
      {
        name: 'b',
        value: {
          type: 'integer',
          isReadOnly: true,
          isExecutable: false,

          integer: 2
        }
      },
      {
        name: 'c',
        value: {
          type: 'string',
          isReadOnly: true,
          isExecutable: false,

          string: '3'
        }
      }
    ]);
  });
});

describe('convertIDictionaryToObject', () => {
  it('returns an object', () => {
    expect(convertIDictionaryToObject(readOnlyDictionary)).toStrictEqual<{ [key in string]: Value }>({
      a: {
        type: 'integer',
        isReadOnly: true,
        isExecutable: false,

        integer: 1
      },
      b: {
        type: 'integer',
        isReadOnly: true,
        isExecutable: false,

        integer: 2
      },
      c: {
        type: 'string',
        isReadOnly: true,
        isExecutable: false,

        string: '3'
      }
    });
  });
});
