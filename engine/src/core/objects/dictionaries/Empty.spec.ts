import { it, expect } from 'vitest';
import { EmptyDictionary } from './Empty.js';
import type { Result, Value } from '@api/index.js';
import { nullValue } from '@api/index.js';

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
  expect(EmptyDictionary.instance.def('test', nullValue)).toStrictEqual<Result<Value>>({
    success: false,
    exception: 'invalidAccess'
  });
});
