import type { Value, ValueType } from '@api/index.js';
import {
  OPERATOR_STATE_UNKNOWN,
  OPERATOR_STATE_FIRST_CALL,
  OPERATOR_STATE_POP,
  OperatorType,
  StackUnderflowException,
  TypeCheckException
} from '@sdk/index.js';
import type { IFunctionOperator, IInternalState, IOperator } from '@sdk/index.js';

export function operatorPop(state: IInternalState, value: Value<ValueType.operator>): void {
  const { calls } = state;
  const operator = value.operator as IFunctionOperator;
  if (calls.topOperatorState === OPERATOR_STATE_FIRST_CALL || calls.topOperatorState === OPERATOR_STATE_POP) {
    calls.pop();
  } else {
    operator.implementation(state, []);
  }
}

export function operatorCycle(state: IInternalState, value: Value<ValueType.operator>): void {
  const { operands, calls } = state;
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
    const parameters: Value[] = [];
    if (operator.typeCheck !== undefined && isFirstCall) {
      let { length } = operator.typeCheck;
      if (operands.length < length) {
        state.raiseException(new StackUnderflowException());
        return;
      }
      for (const valueType of operator.typeCheck) {
        const value = operands.ref[--length]!; // length has been verified before
        if (valueType === null || valueType === value.type) {
          parameters.push(value);
        } else {
          state.raiseException(new TypeCheckException());
          return;
        }
      }
      for (const value of parameters) {
        value.tracker?.addValueRef(value);
      }
    }
    let exceptionBefore = state.exception;
    operator.implementation(state, parameters);
    for (const value of parameters) {
      value.tracker?.releaseValue(value);
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
