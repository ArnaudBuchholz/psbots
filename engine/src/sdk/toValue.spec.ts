import { it, expect } from 'vitest';
import { ValueType } from '@api/index.js';
import { toBooleanValue, toIntegerValue, toStringValue } from './toValue.js';
import { MemoryTracker } from '@core/MemoryTracker.js';

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

it('converts a string (no tracker)', () => {
  const value = toStringValue('abc');
  expect(value).toStrictEqual({
    type: ValueType.string,
    isExecutable: false,
    isReadOnly: true,
    string: 'abc'
  });
});

it('converts a string (tracker)', () => {
  const tracker = new MemoryTracker();
  const value = toStringValue('abc', { tracker });
  expect(value).toStrictEqual({
    type: ValueType.string,
    isExecutable: false,
    isReadOnly: true,
    string: 'abc',
    tracker
  });
});

it('converts an executable string', () => {
  const value = toStringValue('abc', { isExecutable: true });
  expect(value).toStrictEqual({
    type: ValueType.string,
    isExecutable: true,
    isReadOnly: true,
    string: 'abc'
  });
});
