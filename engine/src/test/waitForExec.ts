import type { Result } from '@api/index.js';
import { assert } from '@sdk/index.js';

export function waitForExec(execResult: Result<Generator>): unknown[] {
  assert(execResult);
  const iterator = execResult.value;
  const result = [];
  while (result.length <= 1000) {
    const { value, done } = iterator.next();
    result.push(value);
    if (done === true) {
      return result;
    }
  }
  throw new Error('Too many cycles (infinite loop ?)');
}
