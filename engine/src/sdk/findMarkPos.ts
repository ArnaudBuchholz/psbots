import type { Result } from '@api/index.js';
import { ValueType } from '@api/index.js';
import type { IStack } from '@sdk/interfaces/IStack.js';

export function findMarkPos(stack: IStack): Result<number> {
  let pos = 0;
  while (pos < stack.length) {
    const value = stack.at(pos);
    if (value.type === ValueType.mark) {
      break;
    }
    ++pos;
  }
  if (pos === stack.length) {
    return { success: false, exception: 'unmatchedMark' };
  }
  return { success: true, value: pos };
}
