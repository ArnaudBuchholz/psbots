import type { Value } from '@api/index.js';
import { OPERATOR_STATE_FIRST_CALL, OPERATOR_STATE_UNKNOWN } from '@sdk/index.js';
import type { IInternalState } from '@sdk/index.js';

export function blockCycle(this: IInternalState, top: Value<'array'>): void {
  const { calls, operands } = this;
  const { array } = top;
  const { length } = array;
  if (calls.topOperatorState === OPERATOR_STATE_UNKNOWN) {
    calls.topOperatorState = OPERATOR_STATE_FIRST_CALL;
  } else {
    calls.topOperatorState++;
  }
  if (calls.topOperatorState === length) {
    calls.pop();
  } else {
    const step = calls.topOperatorState;
    const value = array.at(step); // length has been checked
    if (!value.isExecutable || value.type === 'array') {
      operands.push(value);
    } else {
      calls.push(value);
    }
  }
}
