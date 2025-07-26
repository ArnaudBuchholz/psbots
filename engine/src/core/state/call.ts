import type { Value } from '@api/index.js';
import { OPERATOR_STATE_FIRST_CALL } from '@sdk/index.js';
import type { IInternalState } from '@sdk/index.js';

export function callCycle(this: IInternalState, top: Value<'name'>): void {
  const { dictionaries, calls, callEnabled, operands } = this;
  if (calls.topOperatorState === OPERATOR_STATE_FIRST_CALL) {
    calls.pop();
  } else if (callEnabled || ['{', '}', '<<', '«', '>>', '»'].includes(top.name)) {
    calls.topOperatorState = OPERATOR_STATE_FIRST_CALL;
    const result = dictionaries.lookup(top.name);
    if (!result.success) {
      this.raiseException(result.exception);
      return;
    }
    const entry = result.value;
    if (top.debugSource) {
      calls.push(
        Object.assign(
          {
            debugSource: top.debugSource
          },
          entry
        )
      );
    } else {
      calls.push(entry);
    }
  } else {
    operands.push(top);
    calls.pop();
  }
}
