import { USER_MEMORY_TYPE } from '@api/index.js';
import { findMarkPos, toMarkValue } from '@sdk/index.js';
import type { IInternalState } from '@sdk/index.js';
import { ValueArray } from '@core/objects/ValueArray.js';
import type { MemoryTracker } from '@core/MemoryTracker.js';

export function openWithMark({ operands, calls }: IInternalState): void {
  operands.push(
    Object.assign(
      {
        debugSource: calls.top.debugSource
      },
      toMarkValue()
    )
  );
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
    const { top: mark } = operands;
    operands.pop();
    operands.push(
      Object.assign(
        {
          debugSource: mark.debugSource
        },
        array.toValue({ isReadOnly: isExecutable, isExecutable })
      )
    );
  } finally {
    array.release();
  }
}
