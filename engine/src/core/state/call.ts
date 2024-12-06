import type { Value, ValueType } from '@api/index.js';
import { OPERATOR_STATE_FIRST_CALL } from '@sdk/index.js';
import type { IInternalState } from '@sdk/index.js';

export function callCycle(state: IInternalState, value: Value<ValueType.name>): void {
  const { dictionaries, calls, callEnabled, operands } = state;
  if (calls.topOperatorState === OPERATOR_STATE_FIRST_CALL) {
    calls.pop();
  } else if (callEnabled || ['{', '}', '<<', '«', '>>', '»'].includes(value.name)) {
    calls.topOperatorState = OPERATOR_STATE_FIRST_CALL;
    const result = dictionaries.lookup(value.name);
    if (!result.success) {
      state.exception = result.error;
      return;
    }
    const entry = result.value;
    if (value.debugSource) {
      calls.push(
        Object.assign(
          {
            debugSource: value.debugSource
          },
          entry
        )
      );
    } else {
      calls.push(entry);
    }
  } else {
    operands.push(value);
    calls.pop();
  }
}
