import type { Result } from '@api/index.js';
import { ValueType } from '@api/index.js';
import type { IStack } from '@sdk/interfaces/IStack.js';
import { UnmatchedMarkException } from '@sdk/exceptions/UnmatchedMarkException.js';

export function findMarkPos(stack: IStack): Result<number> {
  const pos = stack.ref.findIndex((value) => value.type === ValueType.mark);
  if (pos === -1) {
    return { success: false, error: new UnmatchedMarkException() };
  }
  return { success: true, value: pos };
}
