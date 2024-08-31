import { describe, it, expect } from 'vitest';
import type { Value } from '@api/index.js';
import { enumIArrayValues, ValueType } from '@api/index.js';
import { toValue } from '@test/index.js';

describe('enumIArrayValues', () => {
  const iReadOnlyArray = toValue([1, 2, '3'], { isReadOnly: true }).array;

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
        integer: 1
      },
      {
        type: ValueType.integer,
        isReadOnly: true,
        isExecutable: false,
        integer: 2
      },
      {
        type: ValueType.string,
        isReadOnly: true,
        isExecutable: false,
        string: '3'
      }
    ]);
  });
});
