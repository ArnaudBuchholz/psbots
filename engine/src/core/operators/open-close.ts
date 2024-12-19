import type { Result, Value } from '@api/index.js';
import { USER_MEMORY_TYPE, markValue } from '@api/index.js';
import { findMarkPos } from '@sdk/index.js';
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
        markValue
      )
    );
  } else {
    operands.push(markValue);
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
}): Result<number> {
  if (mark.debugSource && closeOp.debugSource) {
    return operands.push(
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
  }
  return operands.push(value);
}

export function closeToMark(
  state: IInternalState,
  { isExecutable }: { isExecutable: boolean }
): void {
  const { operands, memoryTracker, calls } = state;
  const { top: closeOp } = calls;
  const markPosResult = findMarkPos(operands);
  if (!markPosResult.success) {
    state.raiseException(markPosResult.error);
    return;
  }
  const markPos = markPosResult.value;
  // TODO: apply allocation scheme for increment
  const arrayResult = ValueArray.create(memoryTracker as MemoryTracker, USER_MEMORY_TYPE, Math.max(markPos, 1), 1);
  if (!arrayResult.success) {
    state.raiseException(arrayResult.error);
    return;
  }
  const array = arrayResult.value;
  let index: number;
  for (index = 0; index < markPos; ++index) {
    array.set(markPos - index - 1, operands.top);
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
  array.release();
}
