import type { Value } from '@api/index.js';
import { ValueType } from '@api/index.js';
import { OPERATOR_STATE_FIRST_CALL, OPERATOR_STATE_UNKNOWN } from '@sdk/index.js';
import type { IInternalState } from '@sdk/index.js';

export function blockCycle({ calls, operands }: IInternalState, { array }: Value<ValueType.array>): void {
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
    const value = array.at(step)!; // length has been checked
    if (!value.isExecutable || value.type === ValueType.array) {
      operands.push(value);
    } else {
      calls.push(value);
    }
  }
}
