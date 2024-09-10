import type { Value, ValueType } from '@api/index.js';
import type { IInternalState } from '@sdk/index.js';

export function blockCycle({ calls }: IInternalState, { array }: Value<ValueType.array>): void {
  const { length } = array;
  const step = calls.step ?? 0;
  if (step === length) {
    calls.pop();
  } else {
    calls.step = step + 1;
    calls.push(array.at(step)!); // length has been checked
  }
}
