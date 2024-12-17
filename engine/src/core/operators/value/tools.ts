import { Result, Value, ValueType } from '@api/index.js';
import { RangeCheckException, TypeCheckException } from '@sdk/index';

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
