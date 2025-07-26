import type { Value } from '@api/index.js';
import { SYSTEM_MEMORY_TYPE } from '@api/index.js';
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

export function operatorPop(this: IInternalState, top: Value<'operator'>): void {
  const { calls } = this;
  const operator = top.operator as IFunctionOperator;
  if (calls.topOperatorState >= OPERATOR_STATE_FIRST_CALL || calls.topOperatorState === OPERATOR_STATE_POP) {
    calls.pop();
  } else {
    const result = operator.implementation(this);
    if (result && result.success === false) {
      this.raiseException(result.exception);
    }
  }
}

function handleFunctionOperatorTypeCheck(this: IInternalState, top: IFunctionOperator) {
  const { operands, memoryTracker } = this;
  assert(memoryTracker instanceof MemoryTracker);
  assert(top.typeCheck !== undefined);
  let { length } = top.typeCheck;
  if (operands.length < length) {
    this.raiseException('stackUnderflow');
    return;
  }
  const isAvailable = memoryTracker.allocate({ values: length }, SYSTEM_MEMORY_TYPE, this);
  if (!isAvailable.success) {
    this.raiseException(isAvailable.exception);
    return;
  }
  const values: Value[] = [];
  const valuesMemory = isAvailable.value;
  for (const { type, permissions } of top.typeCheck) {
    const value = operands.at(--length);
    const { isReadOnly, isExecutable } = permissions ?? {};
    if (
      (type === 'null' || type === value.type) &&
      (isReadOnly === undefined || isReadOnly === value.isReadOnly) &&
      (isExecutable === undefined || isExecutable === value.isExecutable)
    ) {
      values.push(value);
    } else {
      this.raiseException('typeCheck');
      memoryTracker.release(valuesMemory, this);
      return;
    }
  }
  for (const value of values) {
    value.tracker?.addValueRef(value);
  }
  return { valuesMemory, values };
}

function handleFunctionOperator(this: IInternalState, top: IFunctionOperator) {
  const { calls, memoryTracker } = this;
  assert(memoryTracker instanceof MemoryTracker);
  const { top: topOfCallStack } = calls;
  const isFirstCall = calls.topOperatorState === OPERATOR_STATE_UNKNOWN;
  if (isFirstCall) {
    calls.topOperatorState = OPERATOR_STATE_FIRST_CALL;
  }
  let valuesMemory: MemoryPointer | undefined;
  let values: Value[] = [];
  if (top.typeCheck !== undefined && isFirstCall) {
    const typeChecked = handleFunctionOperatorTypeCheck.call(this, top);
    if (typeChecked === undefined) {
      return;
    }
    valuesMemory = typeChecked.valuesMemory;
    values = typeChecked.values;
  }
  const exceptionBefore = this.exception;
  const result = top.implementation(this, ...values);
  if (valuesMemory !== undefined) {
    for (const value of values) {
      value.tracker?.releaseValue(value);
    }
    memoryTracker.release(valuesMemory, this);
  }
  if (result && result.success === false) {
    this.raiseException(result.exception);
  }
  if (this.exception !== exceptionBefore) {
    return;
  }
  if (
    calls.length > 0 &&
    calls.top === topOfCallStack &&
    (calls.topOperatorState === OPERATOR_STATE_POP || calls.topOperatorState === OPERATOR_STATE_FIRST_CALL)
  ) {
    calls.pop();
  }
}

export function operatorCycle(this: IInternalState, top: Value<'operator'>): void {
  const { operands, calls } = this;
  if (calls.topOperatorState <= OPERATOR_STATE_FIRST_CALL) {
    operatorPop.call(this, top);
    return;
  }
  const operator = top.operator as IOperator;
  if (operator.type === OperatorType.constant) {
    operands.push(operator.constant);
    calls.pop();
  } else {
    handleFunctionOperator.call(this, operator);
  }
}
