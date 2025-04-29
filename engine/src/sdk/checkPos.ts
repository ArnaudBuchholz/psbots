import type { Result, Value } from '@api/index.js';

export function checkPos(index: Value, length: number): Result<number> {
  if (index.type !== 'integer') {
    return { success: false, exception: 'typeCheck' };
  }
  const { integer: pos } = index;
  if (pos < 0 || pos >= length) {
    return { success: false, exception: 'rangeCheck' };
  }
  return { success: true, value: pos };
}
