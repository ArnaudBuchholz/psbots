import type { Value, ValueType } from '@api/index.js';
import { InternalException, TypeCheckException } from '@sdk/exceptions';
import { StackUnderflowException } from '@sdk/exceptions/StackUnderflowException.js';
import { STEP_DONE } from '@sdk/interfaces/ICallStack.js';
import type { IInternalState } from '@sdk/interfaces/IInternalState.js';
import { OperatorType } from '@sdk/interfaces/IOperator.js';
import type { IOperator } from '@sdk/interfaces/IOperator.js';

export function operatorPop(state: IInternalState, value: Value<ValueType.operator>): void {
  const operator = value.operator as IOperator;
  if (operator.type === OperatorType.constant) {
    throw new InternalException('Unexpected constant operator');
  }
  if (operator.callOnPop) {
    operator.implementation(state, []);
  } else {
    state.calls.pop();
  }
}

export function operatorCycle(state: IInternalState, value: Value<ValueType.operator>): void {
  const { operands, calls } = state;
  if (calls.step === STEP_DONE) {
    operatorPop(state, value);
    return;
  }
  calls.step ??= STEP_DONE;
  const { top } = calls;
  const operator = value.operator as IOperator;
  if (operator.type === OperatorType.constant) {
    operands.push(operator.constant);
    calls.pop();
  } else {
    const parameters: Value[] = [];
    if (operator.typeCheck !== undefined && calls.step === undefined) {
      if (operands.length < operator.typeCheck.length) {
        throw new StackUnderflowException();
      }
      operator.typeCheck.forEach((valueType, index) => {
        const value = operands.ref[index]!; // length has been verified before
        if (valueType === null || valueType === value.type) {
          parameters.push(value);
        } else {
          throw new TypeCheckException();
        }
      });
      parameters.forEach((value) => value.tracker?.addValueRef(value));
    }
    try {
      operator.implementation(state, parameters);
    } finally {
      parameters.forEach((value) => value.tracker?.releaseValue(value));
    }
    if (calls.top === top && calls.step === STEP_DONE) {
      calls.pop();
    }
  }
}
