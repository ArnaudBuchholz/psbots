import { describe, it, expect } from 'vitest';
import type { Value } from '@api/index.js';
import { enumIArrayValues, ValueType } from '@api/index.js';
import { toIReadOnlyArray } from '@test/index.js';

describe('enumIArrayValues', () => {
  const iReadOnlyArray = toIReadOnlyArray([1, 2, '3']);

  it('returns a generator', () => {
    const generator = enumIArrayValues(iReadOnlyArray);
    expect(generator.next).toBeInstanceOf(Function);
  });

  it('returns all values of the array', () => {
    expect([...enumIArrayValues(iReadOnlyArray)]).toStrictEqual<Value[]>([
      {
        type: ValueType.integer,
        isReadOnly: true,
        isExecutable: false,
        isShared: false,
        integer: 1
      },
      {
        type: ValueType.integer,
        isReadOnly: true,
        isExecutable: false,
        isShared: false,
        integer: 2
      },
      {
        type: ValueType.string,
        isReadOnly: true,
        isExecutable: false,
        isShared: false,
        string: '3'
      }
    ]);
  });
});
