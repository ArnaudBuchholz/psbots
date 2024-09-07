import { USER_MEMORY_TYPE } from '@api/index.js';
import { findMarkPos, toMarkValue } from '@sdk/index.js';
import type { IInternalState } from '@sdk/index.js';
import { ValueArray } from '@core/objects/ValueArray.js';
import type { MemoryTracker } from '@core/MemoryTracker.js';

export function openWithMark({ operands }: IInternalState): void {
  // TODO: extract debug info from the call IF not bound
  operands.push(toMarkValue());
}

export function closeToMark(
  { operands, memoryTracker }: IInternalState,
  { isExecutable }: { isExecutable: boolean }
): void {
  const markPos = findMarkPos(operands);
  // TODO: extract debug info from mark and attach it to the resulting array
  const array = new ValueArray(memoryTracker as MemoryTracker, USER_MEMORY_TYPE);
  try {
    let index: number;
    for (index = 0; index < markPos; ++index) {
      array.unshift(operands.top);
      operands.pop();
    }
    operands.pop();
    operands.push(array.toValue({ isReadOnly: isExecutable, isExecutable }));
  } finally {
    array.release();
  }
}
