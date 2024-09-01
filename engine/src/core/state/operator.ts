import type { Value, ValueType } from '@api/index.js';
import { OperatorType, StackUnderflowException, STEP_DONE, STEP_POP, TypeCheckException } from '@sdk/index.js';
import type { IFunctionOperator, IInternalState, IOperator } from '@sdk/index.js';

export function operatorPop(state: IInternalState, value: Value<ValueType.operator>): void {
  const { calls } = state;
  const operator = value.operator as IFunctionOperator;
  if (operator.callOnPop) {
    calls.step = STEP_POP;
    operator.implementation(state, []);
  } else {
    calls.pop();
  }
}

export function operatorCycle(state: IInternalState, value: Value<ValueType.operator>): void {
  const { operands, calls } = state;
  if (calls.step === STEP_DONE || calls.step === STEP_POP) {
    operatorPop(state, value);
    return;
  }
  const { top } = calls;
  const isFirstCall = calls.step === undefined;
  if (isFirstCall) {
    calls.step = STEP_DONE;
  }
  const operator = value.operator as IOperator;
  if (operator.type === OperatorType.constant) {
    operands.push(operator.constant);
    calls.pop();
  } else {
    const parameters: Value[] = [];
    if (operator.typeCheck !== undefined && isFirstCall) {
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
    if (calls.length && calls.top === top && operator.callOnPop !== true && calls.step === STEP_DONE) {
      calls.pop();
    }
  }
}
