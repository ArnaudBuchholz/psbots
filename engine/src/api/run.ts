import type { Exception, IState, Value } from '@api/index.js';
import { toStringValue } from '@sdk/index.js';

const DEFAULT_MAX_ITERATIONS = 1000;

type RunOptions = {
  /** Defaulted to 1000, can be set to Number.POSITIVE_INFINITY but at your own risks */
  maxIterations?: number;
  /** Only throws if an exception is raised *after* engine execution or *after* the max iterations */
  throwException?: boolean;
};

export class RunError extends Error {
  constructor(private readonly _exception: Exception) {
    super(_exception);
    this.name = 'RunError';
  }

  get exception(): Exception {
    return this._exception;
  }
}

/** Returns the number of iterations */
export function run(state: IState, value: string | Value, options?: RunOptions): number {
  if (typeof value === 'string') {
    value = toStringValue(value, { isExecutable: true });
  }
  const execResult = state.exec(value);
  if (!execResult.success) {
    throw new RunError(execResult.exception);
  }
  const {
    maxIterations = DEFAULT_MAX_ITERATIONS,
    throwException = false
  } = options ?? {};
  if (maxIterations <= 0) {
    return 0;
  }
  const iterator = execResult.value;
  let iterations = 0;
  while (iterations < maxIterations) {
    const { done } = iterator.next();
    ++iterations;
    if (done === true) {
      break;
    }
  }
  if (throwException && state.exception) {
    throw new RunError(state.exception);
  }
  return iterations;
}
