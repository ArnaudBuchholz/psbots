import type { Value, ValueType } from '@api/index.js';
import { STEP_DONE } from '@sdk/index.js';
import type { IInternalState } from '@sdk/index.js';

export function callCycle(
  { dictionaries, calls, callEnabled, operands }: IInternalState,
  value: Value<ValueType.string>
): void {
  if (calls.step === STEP_DONE) {
    calls.pop();
  } else if (callEnabled) {
    calls.step = STEP_DONE;
    const entry = dictionaries.lookup(value.string);
    calls.push(
      Object.assign(
        {
          debugSource: value.debugSource
        },
        entry
      )
    );
  } else {
    operands.push(value);
    calls.pop();
  }
}
