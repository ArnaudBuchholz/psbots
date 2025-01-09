import type { Result } from '@api/index.js';
import { assert } from '@sdk/index.js';

export function waitForExec(execResult: Result<Generator>): unknown[] {
  assert(execResult);
  const iterator = execResult.value;
  const result = [];
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { value, done } = iterator.next();
    result.push(value);
    if (result.length > 1000) {
      throw new Error('Too many cycles (infinite loop ?)');
    }
    if (done === true) {
      break;
    }
  }
  return result;
}
