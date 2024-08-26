import type { Value, ValueType } from '@api/index.js';
import { InternalException, TypeCheckException } from '@sdk/exceptions';
import { StackUnderflowException } from '@sdk/exceptions/StackUnderflowException.js';
import { STEP_DONE } from '@sdk/interfaces/ICallStack.js';
import type { IInternalState } from '@sdk/interfaces/IInternalState.js';
import { OperatorType } from '@sdk/interfaces/IOperator.js';
import type { IOperator } from '@sdk/interfaces/IOperator.js';

export function operatorPop({ calls, exception }: IInternalState, value: Value<ValueType.operator>): void {
  const operator = value.operator as IOperator;
  if (operator.type === OperatorType.constant) {
    throw new InternalException('Unexpected constant operator')
  }
  if (calls.step === STEP_DONE) {

  }

  if (this._checkForCatch) {
    if (operator.catch) {
      const exception = this._exception;
      this._exception = undefined;
      operator.catch(this, ))
    }
    this._checkForCatch = false;
  }
  if (operator.finally) {
    operator.finally
  }
  // if operator has catch => exception is removed from state and transmitted to catch, expect only one cycle
  // if operator has finally => call it, expect only one cycle
  // TODO: How do we know in which step we are ?

};

export function operatorCycle(state: IInternalState, value: Value<ValueType.operator>): void {
  const { operands, calls } = state;
  if (calls.step === STEP_DONE) {
    // call operatorPop but only for finally ?
    return;
  }
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
  }
}
