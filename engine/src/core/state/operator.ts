import type { Value } from '@api/index.js';
import { SYSTEM_MEMORY_TYPE, ValueType } from '@api/index.js';
import {
  OPERATOR_STATE_UNKNOWN,
  OPERATOR_STATE_FIRST_CALL,
  OPERATOR_STATE_POP,
  OperatorType,
  assert
} from '@sdk/index.js';
import type { IFunctionOperator, IInternalState, IOperator } from '@sdk/index.js';
import type { MemoryPointer } from '@core/MemoryTracker.js';
import { MemoryTracker } from '@core/MemoryTracker.js';

export function operatorPop(state: IInternalState, value: Value<ValueType.operator>): void {
  const { calls } = state;
  const operator = value.operator as IFunctionOperator;
  // TODO: test calls.topOperatorState >= OPERATOR_STATE_FIRST_CALL
  if (calls.topOperatorState >= OPERATOR_STATE_FIRST_CALL || calls.topOperatorState === OPERATOR_STATE_POP) {
    calls.pop();
  } else {
    // TODO: test what happens if exception during popping
    const result = operator.implementation(state);
    if (result && result.success === false) {
      state.raiseException(result.exception);
    }
  }
}

function handleFunctionOperatorTypeCheck(state: IInternalState, operator: IFunctionOperator) {
  const { operands, memoryTracker } = state;
  assert(memoryTracker instanceof MemoryTracker);
  assert(operator.typeCheck !== undefined);
  let { length } = operator.typeCheck;
  if (operands.length < length) {
    state.raiseException('stackUnderflow');
    return;
  }
  const isAvailable = memoryTracker.allocate({ values: length }, SYSTEM_MEMORY_TYPE, state);
  if (!isAvailable.success) {
    state.raiseException(isAvailable.exception);
    return;
  }
  const values: Value[] = [];
  const valuesMemory = isAvailable.value;
  for (const { type, permissions } of operator.typeCheck) {
    const value = operands.at(--length);
    const { isReadOnly, isExecutable } = permissions ?? {};
    if (
      (type === ValueType.null || type === value.type) &&
      (isReadOnly === undefined || isReadOnly === value.isReadOnly) &&
      (isExecutable === undefined || isExecutable === value.isExecutable)
    ) {
      values.push(value);
    } else {
      state.raiseException('typeCheck');
      memoryTracker.release(valuesMemory, state);
      return;
    }
  }
  for (const value of values) {
    value.tracker?.addValueRef(value);
  }
  return { valuesMemory, values };
}

function handleFunctionOperator(state: IInternalState, operator: IFunctionOperator) {
  const { calls, memoryTracker } = state;
  assert(memoryTracker instanceof MemoryTracker);
  const { top } = calls;
  const isFirstCall = calls.topOperatorState === OPERATOR_STATE_UNKNOWN;
  if (isFirstCall) {
    calls.topOperatorState = OPERATOR_STATE_FIRST_CALL;
  }
  let valuesMemory: MemoryPointer | undefined;
  let values: Value[] = [];
  if (operator.typeCheck !== undefined && isFirstCall) {
    const typeChecked = handleFunctionOperatorTypeCheck(state, operator);
    if (typeChecked === undefined) {
      return;
    }
    valuesMemory = typeChecked.valuesMemory;
    values = typeChecked.values;
  }
  const exceptionBefore = state.exception;
  const result = operator.implementation(state, ...values);
  if (valuesMemory !== undefined) {
    for (const value of values) {
      value.tracker?.releaseValue(value);
    }
    memoryTracker.release(valuesMemory, state);
  }
  if (result && result.success === false) {
    state.raiseException(result.exception);
  }
  if (state.exception !== exceptionBefore) {
    return;
  }
  if (
    calls.length > 0 &&
    calls.top === top &&
    (calls.topOperatorState === OPERATOR_STATE_POP || calls.topOperatorState === OPERATOR_STATE_FIRST_CALL)
  ) {
    calls.pop();
  }
}

export function operatorCycle(state: IInternalState, value: Value<ValueType.operator>): void {
  const { operands, calls } = state;
  if (calls.topOperatorState <= OPERATOR_STATE_FIRST_CALL) {
    operatorPop(state, value);
    return;
  }
  const operator = value.operator as IOperator;
  if (operator.type === OperatorType.constant) {
    operands.push(operator.constant);
    calls.pop();
  } else {
    handleFunctionOperator(state, operator);
  }
}
