import type { Value } from '@api/index.js';
import { USER_MEMORY_TYPE } from '@api/index.js';
import { findMarkPos, toMarkValue } from '@sdk/index.js';
import type { IInternalState, IStack } from '@sdk/index.js';
import { ValueArray } from '@core/objects/ValueArray.js';
import type { MemoryTracker } from '@core/MemoryTracker.js';

export function openWithMark({ operands, calls }: IInternalState): void {
  if (calls.top.debugSource) {
    operands.push(
      Object.assign(
        {
          debugSource: calls.top.debugSource
        },
        toMarkValue()
      )
    );
  } else {
    operands.push(toMarkValue());
  }
}

export function pushOpenClosedValueWithDebugInfo({
  operands,
  value,
  mark,
  closeOp
}: {
  operands: IStack;
  value: Value;
  mark: Value;
  closeOp: Value;
}): void {
  if (mark.debugSource && closeOp.debugSource) {
    operands.push(
      Object.assign(
        {
          debugSource: {
            ...mark.debugSource,
            length: closeOp.debugSource.pos - mark.debugSource.pos + closeOp.debugSource.length
          }
        },
        value
      )
    );
  } else {
    operands.push(value);
  }
}

export function closeToMark(
  { operands, memoryTracker, calls }: IInternalState,
  { isExecutable }: { isExecutable: boolean }
): void {
  const { top: closeOp } = calls;
  const markPos = findMarkPos(operands);
  const array = new ValueArray(memoryTracker as MemoryTracker, USER_MEMORY_TYPE);
  try {
    let index: number;
    for (index = 0; index < markPos; ++index) {
      array.unshift(operands.top);
      operands.pop();
    }
    const { top: mark } = operands;
    operands.pop();
    pushOpenClosedValueWithDebugInfo({
      operands,
      value: array.toValue({ isReadOnly: isExecutable, isExecutable }),
      mark,
      closeOp
    });
  } finally {
    array.release();
  }
}
