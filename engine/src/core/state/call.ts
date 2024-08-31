import type { Value, ValueType } from '@api/index.js';
import { STEP_DONE, UndefinedException } from '@sdk/index.js';
import type { IInternalState } from '@sdk/index.js';

export function callCycle({ dictionaries, calls }: IInternalState, value: Value<ValueType.string>): void {
  if (calls.step === STEP_DONE) {
    calls.pop();
  } else {
    calls.step = STEP_DONE;
    const entry = dictionaries.lookup(value.string);
    if (entry === null) {
      throw new UndefinedException();
    }
    calls.push(entry);
  }
}
