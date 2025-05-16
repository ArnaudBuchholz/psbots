import type { Result, Value } from '@api/index.js';
import { USER_MEMORY_TYPE, markValue } from '@api/index.js';
import { assert, findMarkPos, OPERATOR_STATE_FIRST_CALL, OPERATOR_STATE_POP, toIntegerValue } from '@sdk/index.js';
import type { IInternalState, IOperandStack } from '@sdk/index.js';
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
  operands: IOperandStack;
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

const CALLS_MARKPOS = 'markpos';
const CALLS_ARRAY = 'array';
export const OPERATOR_STATE_ALLOC_ARRAY = 1;
const OPERATOR_STATE_FILL_ARRAY = 2;

export function closeToMark(state: IInternalState, { isExecutable }: { isExecutable: boolean }): Result<unknown> {
  const { operands, memoryTracker, calls } = state;
  const { top: closeOp } = calls;
  if (calls.topOperatorState === OPERATOR_STATE_FIRST_CALL) {
    const markPosResult = findMarkPos(operands);
    if (!markPosResult.success) {
      return markPosResult;
    }
    const markPos = markPosResult.value;
    const integerResult = toIntegerValue(markPos);
    assert(integerResult);
    const defined = calls.def(CALLS_MARKPOS, integerResult.value);
    if (defined.success) {
      calls.topOperatorState = OPERATOR_STATE_ALLOC_ARRAY;
    }
    return defined;
  }
  const markPosValue = calls.lookup(CALLS_MARKPOS);
  assert(markPosValue.type === 'integer');
  const markPos = markPosValue.integer;
  if (calls.topOperatorState === OPERATOR_STATE_ALLOC_ARRAY) {
    const arrayResult = ValueArray.create(memoryTracker as MemoryTracker, USER_MEMORY_TYPE, Math.max(markPos, 1), 1);
    if (!arrayResult.success) {
      return arrayResult;
    }
    const array = arrayResult.value;
    const defined = calls.def(CALLS_ARRAY, array.toValue({ isReadOnly: isExecutable, isExecutable }));
    if (defined.success) {
      calls.topOperatorState = OPERATOR_STATE_FILL_ARRAY;
    } else {
      array.release();
    }
    return defined;
  }
  const arrayValue = calls.lookup(CALLS_ARRAY);
  assert(arrayValue.type === 'array');
  const array = arrayValue.array;
  assert(array instanceof ValueArray);
  const index = calls.topOperatorState - OPERATOR_STATE_FILL_ARRAY;
  if (index < markPos) {
    calls.topOperatorState = OPERATOR_STATE_FILL_ARRAY + index + 1;
    const setResult = array.set(markPos - index - 1, operands.at(index));
    if (!setResult.success) {
      array.release();
      calls.topOperatorState = OPERATOR_STATE_ALLOC_ARRAY;
    }
    return setResult;
  }
  const mark = operands.at(index);
  const result = pushOpenClosedValueWithDebugInfo({
    operands,
    popCount: 1 + markPos,
    value: arrayValue,
    mark,
    closeOp
  });
  calls.topOperatorState = result.success ? OPERATOR_STATE_POP : OPERATOR_STATE_ALLOC_ARRAY;
  array.release();
  return result;
}
