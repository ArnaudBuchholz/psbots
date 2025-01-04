import { SYSTEM_MEMORY_TYPE, Value, ValueType } from '@api/index.js';
import {
  OPERATOR_STATE_UNKNOWN,
  OPERATOR_STATE_FIRST_CALL,
  OPERATOR_STATE_POP,
  OperatorType,
  StackUnderflowException,
  TypeCheckException,
  assert
} from '@sdk/index.js';
import type { IFunctionOperator, IInternalState, IOperator } from '@sdk/index.js';
import { MemoryPointer, MemoryTracker } from '@core/MemoryTracker.js';

export function operatorPop(state: IInternalState, value: Value<ValueType.operator>): void {
  const { calls } = state;
  const operator = value.operator as IFunctionOperator;
  if (calls.topOperatorState === OPERATOR_STATE_FIRST_CALL || calls.topOperatorState === OPERATOR_STATE_POP) {
    calls.pop();
  } else {
    operator.implementation(state);
  }
}

export function operatorCycle(state: IInternalState, value: Value<ValueType.operator>): void {
  const { operands, calls, memoryTracker } = state;
  assert(memoryTracker instanceof MemoryTracker);
  if (calls.topOperatorState <= OPERATOR_STATE_FIRST_CALL) {
    operatorPop(state, value);
    return;
  }
  const { top } = calls;
  const isFirstCall = calls.topOperatorState === OPERATOR_STATE_UNKNOWN;
  if (isFirstCall) {
    calls.topOperatorState = OPERATOR_STATE_FIRST_CALL;
  }
  const operator = value.operator as IOperator;
  if (operator.type === OperatorType.constant) {
    operands.push(operator.constant);
    calls.pop();
  } else {
    let valuesMemory: MemoryPointer | undefined;
    const values: Value[] = [];
    if (operator.typeCheck !== undefined && isFirstCall) {
      let { length } = operator.typeCheck;
      if (operands.length < length) {
        state.raiseException(new StackUnderflowException());
        return;
      }
      const isAvailable = memoryTracker.allocate({ values: length }, SYSTEM_MEMORY_TYPE, state);
      if (!isAvailable.success) {
        state.raiseException(isAvailable.error);
        return;
      }
      valuesMemory = isAvailable.value;
      for (const { type, permissions} of operator.typeCheck) {
        const value = operands.at(--length);
        const { isReadOnly, isExecutable } = permissions ?? {};
        if ((type === ValueType.null || type === value.type)
          && (isReadOnly === undefined || isReadOnly === value.isReadOnly)
          && (isExecutable === undefined || isExecutable === value.isExecutable)
        ) {
          values.push(value);
        } else {
          state.raiseException(new TypeCheckException());
          memoryTracker.release(valuesMemory, state);
          return;
        }
      }
      for (const value of values) {
        value.tracker?.addValueRef(value);
      }
    }
    let exceptionBefore = state.exception;
    const result = operator.implementation(state, ...values);
    if (valuesMemory !== undefined) {
      for (const value of values) {
        value.tracker?.releaseValue(value);
      }
      memoryTracker.release(valuesMemory, state);
    }
    if (result && result.success === false) {
      state.raiseException(result.error);
    }
    if (state.exception !== exceptionBefore) {
      return;
    }
    if (
      calls.length &&
      calls.top === top &&
      (calls.topOperatorState === OPERATOR_STATE_POP || calls.topOperatorState === OPERATOR_STATE_FIRST_CALL)
    ) {
      calls.pop();
    }
  }
}
