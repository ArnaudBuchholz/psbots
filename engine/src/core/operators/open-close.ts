import type { Result, Value } from '@api/index.js';
import { USER_MEMORY_TYPE, markValue } from '@api/index.js';
import { findMarkPos } from '@sdk/index.js';
import type { IInternalState, IStack } from '@sdk/index.js';
import { ValueArray } from '@core/objects/ValueArray.js';
import type { MemoryTracker } from '@core/MemoryTracker.js';

export function openWithMark({ operands, calls }: IInternalState): Result<number> {
  if (calls.top.debugSource) {
    return operands.push(
      Object.assign(
        {
          debugSource: calls.top.debugSource
        },
        markValue
      )
    );
  }
  return operands.push(markValue);
}

export function pushOpenClosedValueWithDebugInfo({
  operands,
  popCount,
  value,
  mark,
  closeOp
}: {
  operands: IStack;
  popCount: number;
  value: Value;
  mark: Value;
  closeOp: Value;
}): Result<number> {
  if (mark.debugSource && closeOp.debugSource) {
    return operands.popush(
      popCount,
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
  return operands.popush(popCount, value);
}

export function closeToMark(state: IInternalState, { isExecutable }: { isExecutable: boolean }): Result<unknown> {
  const { operands, memoryTracker, calls } = state;
  const { top: closeOp } = calls;
  const markPosResult = findMarkPos(operands);
  if (!markPosResult.success) {
    return markPosResult;
  }
  const markPos = markPosResult.value;
  // TODO: apply allocation scheme for increment
  const arrayResult = ValueArray.create(memoryTracker as MemoryTracker, USER_MEMORY_TYPE, Math.max(markPos, 1), 1);
  if (!arrayResult.success) {
    return arrayResult;
  }
  const array = arrayResult.value;
  let index: number;
  for (index = 0; index < markPos; ++index) {
    array.set(markPos - index - 1, operands.top);
    operands.pop();
  }
  const { top: mark } = operands;
  const result = pushOpenClosedValueWithDebugInfo({
    operands,
    popCount: 1,
    value: array.toValue({ isReadOnly: isExecutable, isExecutable }),
    mark,
    closeOp
  });
  array.release();
  return result;
}
