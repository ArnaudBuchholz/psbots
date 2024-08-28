import { it, expect } from 'vitest';
import { ValueType } from '@api/index.js';
import { toBooleanValue, toIntegerValue } from './toValue.js';

it('converts a boolean', () => {
  const value = toBooleanValue(true);
  expect(value).toStrictEqual({
    type: ValueType.boolean,
    isExecutable: false,
    isReadOnly: true,
    isSet: true
  });
});

it('converts an integer', () => {
  const value = toIntegerValue(1);
  expect(value).toStrictEqual({
    type: ValueType.integer,
    isExecutable: false,
    isReadOnly: true,
    integer: 1
  });
});
