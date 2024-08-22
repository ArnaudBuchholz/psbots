import { it, expect } from 'vitest';
import { SystemDictionary } from './System.js';

it('always return the same instance', () => {
  expect(SystemDictionary.instance).toStrictEqual(SystemDictionary.instance);
});

it('returns names', () => {
  expect(SystemDictionary.instance.names).toBeInstanceOf(Array);
});

it('does not fail on lookup', () => {
  expect(() => SystemDictionary.instance.lookup('--unknown--')).not.toThrowError();
});
