import { describe, it, expect } from 'vitest';
import type { Result, Value } from '@api/index.js';
import { toIntegerValue, toNameValue, toStringValue } from './toValue.js';
import { MemoryTracker } from '@core/MemoryTracker.js';
import { assert } from './assert.js';

describe('toIntegerValue', () => {
  it('converts an integer', () => {
    const valueResult = toIntegerValue(1);
    assert(valueResult);
    const { value } = valueResult;
    expect(value).toStrictEqual<Value<'integer'>>({
      type: 'integer',
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
        exception: 'undefinedResult'
      });
    });

    it('fails on POSITIVE_INFINITY', () => {
      const integerResult = toIntegerValue(Number.POSITIVE_INFINITY);
      expect(integerResult).toStrictEqual<Result<number>>({
        success: false,
        exception: 'undefinedResult'
      });
    });

    it('fails on NEGATIVE_INFINITY', () => {
      const integerResult = toIntegerValue(Number.NEGATIVE_INFINITY);
      expect(integerResult).toStrictEqual<Result<number>>({
        success: false,
        exception: 'undefinedResult'
      });
    });

    it('if bigger than MAX_SAFE_INTEGER', () => {
      const integerResult = toIntegerValue(Number.MAX_SAFE_INTEGER + 1);
      expect(integerResult).toStrictEqual<Result<number>>({
        success: false,
        exception: 'undefinedResult'
      });
    });

    it('if smaller than MAX_SAFE_INTEGER', () => {
      const integerResult = toIntegerValue(Number.MIN_SAFE_INTEGER - 1);
      expect(integerResult).toStrictEqual<Result<number>>({
        success: false,
        exception: 'undefinedResult'
      });
    });
  });
});

it('converts a string (no tracker)', () => {
  const value = toStringValue('abc');
  expect(value).toStrictEqual<Value<'string'>>({
    type: 'string',
    isExecutable: false,
    isReadOnly: true,
    string: 'abc'
  });
});

it('converts a string (tracker)', () => {
  const tracker = new MemoryTracker();
  const value = toStringValue('abc', { tracker });
  expect(value).toStrictEqual<Value<'string'>>({
    type: 'string',
    isExecutable: false,
    isReadOnly: true,
    string: 'abc',
    tracker
  });
});

it('converts an executable string', () => {
  const value = toStringValue('abc', { isExecutable: true });
  expect(value).toStrictEqual<Value<'string'>>({
    type: 'string',
    isExecutable: true,
    isReadOnly: true,
    string: 'abc'
  });
});

it('converts a name (no tracker)', () => {
  const value = toNameValue('abc');
  expect(value).toStrictEqual<Value<'name'>>({
    type: 'name',
    isExecutable: false,
    isReadOnly: true,
    name: 'abc'
  });
});

it('converts a string (tracker)', () => {
  const tracker = new MemoryTracker();
  const value = toNameValue('abc', { tracker });
  expect(value).toStrictEqual<Value<'name'>>({
    type: 'name',
    isExecutable: false,
    isReadOnly: true,
    name: 'abc',
    tracker
  });
});

it('converts an executable string', () => {
  const value = toNameValue('abc', { isExecutable: true });
  expect(value).toStrictEqual<Value<'name'>>({
    type: 'name',
    isExecutable: true,
    isReadOnly: true,
    name: 'abc'
  });
});
