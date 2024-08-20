import { it, expect } from 'vitest';
import { EmptyDictionary } from './Empty.js';

it('always return the same instance', () => {
  expect(EmptyDictionary.instance).toStrictEqual(EmptyDictionary.instance);
});

it('returns no names', () => {
  expect(EmptyDictionary.instance.names).toStrictEqual([]);
});

it('returns nothing', () => {
  expect(EmptyDictionary.instance.lookup()).toStrictEqual(null);
});
