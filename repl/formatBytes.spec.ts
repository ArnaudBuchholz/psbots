import { it, expect } from 'vitest';
import { formatBytes } from './formatBytes.js';

const values = {
  1: '1B',
  10: '10B',
  100: '100B',
  1000: '1000B',
  1024: '1.00kB',
  1500: '1.46kB',
  2048: '2.00kB',
  1_048_576: '1.00MB'
};

for (const [bytes, expected] of Object.entries(values)) {
  it(`converts ${bytes} to ${expected}`, () => {
    expect(formatBytes(Number.parseInt(bytes, 10))).toStrictEqual(expected);
  });
}
