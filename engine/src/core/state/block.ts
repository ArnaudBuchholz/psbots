import type { Value, ValueType } from '@api/index.js';
import { OPERATOR_STATE_FIRST_CALL, OPERATOR_STATE_UNKNOWN, type IInternalState } from '@sdk/index.js';

export function blockCycle({ calls }: IInternalState, { array }: Value<ValueType.array>): void {
  const { length } = array;
  if (calls.topOperatorState === OPERATOR_STATE_UNKNOWN) {
    calls.topOperatorState = OPERATOR_STATE_FIRST_CALL; 
  }
  if (calls.topOperatorState === length) {
    calls.pop();
  } else {
    const step = calls.topOperatorState;
    calls.topOperatorState = step + 1;
    calls.push(array.at(step)!); // length has been checked
  }
}
