import { describe, it, expect } from 'vitest';
import { ValueType } from '@api/index.js';
import { toBooleanValue, toIntegerValue, toStringValue } from './toValue.js';
import { MemoryTracker } from '@core/MemoryTracker.js';
import { UndefinedResultException } from '@sdk/exceptions/UndefinedResultException.js';

it('converts a boolean', () => {
  const value = toBooleanValue(true);
  expect(value).toStrictEqual({
    type: ValueType.boolean,
    isExecutable: false,
    isReadOnly: true,
    isSet: true
  });
});

describe('toIntegerValue', () => {
  it('converts an integer', () => {
    const value = toIntegerValue(1);
    expect(value).toStrictEqual({
      type: ValueType.integer,
      isExecutable: false,
      isReadOnly: true,
      integer: 1
    });
  });

  describe('UndefinedResultException', () => {
    it('fails on non-integer', () => {
      expect(() => toIntegerValue(1.2)).toThrowError(UndefinedResultException);
    });

    it('fails on POSITIVE_INFINITY', () => {
      expect(() => toIntegerValue(Number.POSITIVE_INFINITY)).toThrowError(UndefinedResultException);
    });

    it('fails on NEGATIVE_INFINITY', () => {
      expect(() => toIntegerValue(Number.NEGATIVE_INFINITY)).toThrowError(UndefinedResultException);
    });

    it('if bigger than MAX_SAFE_INTEGER', () => {
      expect(() => toIntegerValue(Number.MAX_SAFE_INTEGER + 1)).toThrowError(UndefinedResultException);
    });

    it('if smaller than MAX_SAFE_INTEGER', () => {
      expect(() => toIntegerValue(Number.MIN_SAFE_INTEGER - 1)).toThrowError(UndefinedResultException);
    });
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
