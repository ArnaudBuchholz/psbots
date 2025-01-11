import { it, expect } from 'vitest';
import { getExceptionMessage } from './Exception.js';

it('provides an error message for the exceptions (stop)', () => {
  expect(getExceptionMessage('stop')).toMatch(/\w+/);
});
