import { ValueType } from '@api/index.js';
import type { IStack } from '@sdk/interfaces/IStack.js';
import { UnmatchedMarkException } from '@sdk/exceptions/UnmatchedMarkException.js';

export function findMarkPos(stack: IStack): number {
  const pos = stack.ref.findIndex((value) => value.type === ValueType.mark);
  if (pos === -1) {
    throw new UnmatchedMarkException();
  }
  return pos;
}
