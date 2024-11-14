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
  valid.forEach((value) => it(`validates ${stringify(value)}`, () => expect(is(value)).toStrictEqual(true)));
  invalid.forEach((value) => it(`rejects ${stringify(value)}`, () => expect(is(value)).toStrictEqual(false)));
}
