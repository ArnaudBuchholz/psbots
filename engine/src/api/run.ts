import type { Exception, IState, Value } from '@api/index.js';
import { toStringValue } from '@sdk/index.js';

const DEFAULT_MAX_CYCLES = 1000;

type RunOptions = {
  /** Defaulted to 1000, can be set to Number.POSITIVE_INFINITY but at your own risks */
  maxCycles?: number;
  /** Only throws if an exception is raised *after* engine execution or *after* the max cycles */
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

/** Executes the source in the engine, returns the number of executed cycles */
export function run(state: IState, value: string, options?: RunOptions): number;
/** Executes the value in the engine, returns the number of executed cycles */
export function run(state: IState, value: Value, options?: RunOptions): number;
/** Iterates on the generator, returns the number of executed cycles */
export function run(state: IState, value: Generator, options?: RunOptions): number;
export function run(state: IState, value: string | Value | Generator, options?: RunOptions): number {
  let iterator: Generator;
  if (typeof value === 'object' && 'next' in value) {
    iterator = value;
  } else {
    if (typeof value === 'string') {
      value = toStringValue(value, { isExecutable: true });
    }
    const execResult = state.exec(value);
    if (!execResult.success) {
      throw new RunError(execResult.exception);
    }
    iterator = execResult.value;
  }
  const {
    maxCycles = DEFAULT_MAX_CYCLES,
    throwException = false
  } = options ?? {};
  if (maxCycles <= 0) {
    return 0;
  }
  let cycles = 0;
  while (cycles < maxCycles) {
    const { done } = iterator.next();
    ++cycles;
    if (done === true) {
      break;
    }
  }
  if (throwException && state.exception) {
    throw new RunError(state.exception);
  }
  return cycles;
}
