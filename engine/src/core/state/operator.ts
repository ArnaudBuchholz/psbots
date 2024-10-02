import type { Value, ValueType } from '@api/index.js';
import {
  OPERATOR_STATE_UNKNOWN,
  OPERATOR_STATE_FIRST_CALL,
  OPERATOR_STATE_POP,
  OPERATOR_STATE_REQUEST_CALL_BEFORE_POP,
  OPERATOR_STATE_CALL_BEFORE_POP,
  OperatorType,
  StackUnderflowException,
  TypeCheckException
} from '@sdk/index.js';
import type { IFunctionOperator, IInternalState, IOperator } from '@sdk/index.js';

export function operatorPop(state: IInternalState, value: Value<ValueType.operator>): void {
  const { calls } = state;
  const operator = value.operator as IFunctionOperator;
  if (calls.topOperatorState === OPERATOR_STATE_REQUEST_CALL_BEFORE_POP) {
    calls.topOperatorState = OPERATOR_STATE_CALL_BEFORE_POP;
    operator.implementation(state, []);
  } else {
    calls.pop();
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
        throw new StackUnderflowException();
      }
      operator.typeCheck.forEach((valueType) => {
        const value = operands.ref[--length]!; // length has been verified before
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
    if (
      calls.length &&
      calls.top === top &&
      (calls.topOperatorState === OPERATOR_STATE_POP || calls.topOperatorState === OPERATOR_STATE_FIRST_CALL)
    ) {
      calls.pop();
    }
  }
}
