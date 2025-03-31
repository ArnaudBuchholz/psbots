import type { Result } from '@api/index.js';
import { assert } from '@sdk/assert.js';

const DEFAULT_MAX_ITERATIONS = 1000;

type RunOptions = {
  /** Defaulted to 1000, can be set to Number.POSITIVE_INFINITY but at your own risks */
  maxIterations?: number;
  // TODO: throw on error ?
};

/** Returns the number of iterations */
export function run(execResult: Result<Generator>, options?: RunOptions): number {
  assert(execResult);
  const { maxIterations = DEFAULT_MAX_ITERATIONS } = options ?? {};
  const iterator = execResult.value;
  let iterations = 0;
  while (iterations < maxIterations) {
    const { done } = iterator.next();
    ++iterations;
    if (done === true) {
      break;
    }
  }
  return iterations;
}
