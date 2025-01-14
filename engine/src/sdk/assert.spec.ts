import { it, expect } from 'vitest';
import { assert } from './assert.js';

it('fails when condition is false', () => {
  expect(() => assert(false)).toThrowError();
});

it('fails when condition is Result is false', () => {
  expect(() => assert({ success: false, exception: 'dictStackUnderflow' })).toThrowError();
});
