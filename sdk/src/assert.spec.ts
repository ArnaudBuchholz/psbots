import { it, expect } from 'vitest';
import { assert, AssertionFailed } from './assert.js';

it('does nothing when condition is true', () => {
  expect(() => assert(true)).not.toThrow();
});

it('fails when condition is false', () => {
  expect(() => assert(false)).toThrow(AssertionFailed);
});
