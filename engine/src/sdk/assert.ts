import type { Result } from '@api/index.js';

class AssertionFailed extends Error {
  constructor(message: string, cause: unknown) {
    super(message);
    this.name = 'AssertionFailed';
    this.cause = cause;
  }
}

export function assert<T>(result: Result<T>): asserts result is { success: true; value: T };
export function assert(condition: boolean, message?: string, cause?: unknown): asserts condition;
export function assert(condition: boolean | Result<unknown>, message?: string, cause?: unknown) {
  if (typeof condition !== 'boolean') {
    if (!condition.success) {
      throw new AssertionFailed('Unexpected failed result', condition.exception);
    }
  } else if (!condition) {
    throw new AssertionFailed(message ?? 'assertion failed', cause);
  }
}
