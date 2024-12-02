import { it, expect } from 'vitest';
import { EmptyDictionary } from './Empty.js';
import { nullValue, Result, Value } from '@api/index.js';
import { InvalidAccessException } from '@sdk/index.js';

it('always return the same instance', () => {
  expect(EmptyDictionary.instance).toStrictEqual(EmptyDictionary.instance);
});

it('returns no names', () => {
  expect(EmptyDictionary.instance.names).toStrictEqual([]);
});

it('returns nothing', () => {
  expect(EmptyDictionary.instance.lookup()).toStrictEqual(nullValue);
});

it('does not accept any key', () => {
  expect(EmptyDictionary.instance.def('test', nullValue)).toStrictEqual<Result<Value>>({ success: false, error: expect.any(InvalidAccessException) });
});
