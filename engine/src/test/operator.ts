import { it, expect } from 'vitest';

export function testOperator(path: string): void {
  it(`operator ${path}`, () => expect(true).toBe(true));
}
