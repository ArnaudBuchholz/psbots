import type { Result, Value } from '@api/index.js';
import { ValueType } from '@api/index.js';
import { RangeCheckException } from '@sdk/exceptions/RangeCheckException.js';
import { TypeCheckException } from '@sdk/exceptions/TypeCheckException.js';

export function checkPos(index: Value, length: number): Result<number> {
  if (index.type !== ValueType.integer) {
    return { success: false, error: new TypeCheckException() };
  }
  const { integer: pos } = index;
  if (pos < 0 || pos >= length) {
    return { success: false, error: new RangeCheckException() };
  }
  return { success: true, value: pos };
}
