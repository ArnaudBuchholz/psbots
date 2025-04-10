import { it, expect } from 'vitest';
import { stringify } from '@test/stringify.js';

export function testIsFunction<T>({
  is,
  valid,
  invalid
}: {
  is: (value: unknown) => boolean;
  valid: T[];
  invalid: unknown[];
}): void {
  for (const value of valid) {
    it(`validates ${stringify(value)}`, () => expect(is(value)).toStrictEqual(true));
  }
  for (const value of invalid) {
    it(`rejects ${stringify(value)}`, () => expect(is(value)).toStrictEqual(false));
  }
}
