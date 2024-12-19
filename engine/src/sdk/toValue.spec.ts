import { describe, it, expect } from 'vitest';
import type { Result, Value } from '@api/index.js';
import { ValueType } from '@api/index.js';
import { toBooleanValue, toIntegerValue, toNameValue, toStringValue } from './toValue.js';
import { MemoryTracker } from '@core/MemoryTracker.js';
import { UndefinedResultException } from '@sdk/exceptions/UndefinedResultException.js';
import { assert } from './exceptions/AssertException.js';

it('converts a boolean', () => {
  const value = toBooleanValue(true);
  expect(value).toStrictEqual<Value<ValueType.boolean>>({
    type: ValueType.boolean,
    isExecutable: false,
    isReadOnly: true,
    isSet: true
  });
});

describe('toIntegerValue', () => {
  it('converts an integer', () => {
    const valueResult = toIntegerValue(1);
    assert(valueResult);
    const { value } = valueResult;
    expect(value).toStrictEqual<Value<ValueType.integer>>({
      type: ValueType.integer,
      isExecutable: false,
      isReadOnly: true,
      integer: 1
    });
  });

  describe('UndefinedResultException', () => {
    it('fails on non-integer', () => {
      const integerResult = toIntegerValue(1.2);
      expect(integerResult).toStrictEqual<Result<number>>({
        success: false,
        error: expect.any(UndefinedResultException)
      });
    });

    it('fails on POSITIVE_INFINITY', () => {
      const integerResult = toIntegerValue(Number.POSITIVE_INFINITY);
      expect(integerResult).toStrictEqual<Result<number>>({
        success: false,
        error: expect.any(UndefinedResultException)
      });
    });

    it('fails on NEGATIVE_INFINITY', () => {
      const integerResult = toIntegerValue(Number.NEGATIVE_INFINITY);
      expect(integerResult).toStrictEqual<Result<number>>({
        success: false,
        error: expect.any(UndefinedResultException)
      });
    });

    it('if bigger than MAX_SAFE_INTEGER', () => {
      const integerResult = toIntegerValue(Number.MAX_SAFE_INTEGER + 1);
      expect(integerResult).toStrictEqual<Result<number>>({
        success: false,
        error: expect.any(UndefinedResultException)
      });
    });

    it('if smaller than MAX_SAFE_INTEGER', () => {
      const integerResult = toIntegerValue(Number.MIN_SAFE_INTEGER - 1);
      expect(integerResult).toStrictEqual<Result<number>>({
        success: false,
        error: expect.any(UndefinedResultException)
      });
    });
  });
});

it('converts a string (no tracker)', () => {
  const value = toStringValue('abc');
  expect(value).toStrictEqual<Value<ValueType.string>>({
    type: ValueType.string,
    isExecutable: false,
    isReadOnly: true,
    string: 'abc'
  });
});

it('converts a string (tracker)', () => {
  const tracker = new MemoryTracker();
  const value = toStringValue('abc', { tracker });
  expect(value).toStrictEqual<Value<ValueType.string>>({
    type: ValueType.string,
    isExecutable: false,
    isReadOnly: true,
    string: 'abc',
    tracker
  });
});

it('converts an executable string', () => {
  const value = toStringValue('abc', { isExecutable: true });
  expect(value).toStrictEqual<Value<ValueType.string>>({
    type: ValueType.string,
    isExecutable: true,
    isReadOnly: true,
    string: 'abc'
  });
});

it('converts a name (no tracker)', () => {
  const value = toNameValue('abc');
  expect(value).toStrictEqual<Value<ValueType.name>>({
    type: ValueType.name,
    isExecutable: false,
    isReadOnly: true,
    name: 'abc'
  });
});

it('converts a string (tracker)', () => {
  const tracker = new MemoryTracker();
  const value = toNameValue('abc', { tracker });
  expect(value).toStrictEqual<Value<ValueType.name>>({
    type: ValueType.name,
    isExecutable: false,
    isReadOnly: true,
    name: 'abc',
    tracker
  });
});

it('converts an executable string', () => {
  const value = toNameValue('abc', { isExecutable: true });
  expect(value).toStrictEqual<Value<ValueType.name>>({
    type: ValueType.name,
    isExecutable: true,
    isReadOnly: true,
    name: 'abc'
  });
});
