import { it, expect } from 'vitest';
import { stringify } from '@test/stringify.js';

export function testCheckFunction<T>({
  check,
  valid,
  invalid
}: {
  check: (value: unknown) => void;
  valid: T[];
  invalid: unknown[];
}): void {
  valid.forEach((value) => it(`validates ${stringify(value)}`, () => expect(() => check(value)).not.toThrowError()));
  invalid.forEach((value) => it(`rejects ${stringify(value)}`, () => expect(() => check(value)).toThrowError()));
}
