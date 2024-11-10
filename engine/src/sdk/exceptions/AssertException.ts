import type { Result } from '@api/index.js';
import { BaseException } from '@sdk/exceptions/BaseException.js';

class AssertException extends BaseException {
  constructor(message: string, cause: unknown) {
    super(message);
    this.cause = cause;
  }
}

export function assert(result: Result<unknown>): asserts result is { success: true; value: undefined };
export function assert(condition: boolean, message: string, cause?: unknown): asserts condition;
export function assert(condition: boolean | Result<unknown>, message?: string, cause?: unknown) {
  if (typeof condition !== 'boolean') {
    if (!condition.success) {
      throw new AssertException('Unexpected failed result', condition.error);
    }
  } else if (!condition) {
    throw new AssertException(message ?? 'assertion failed', cause);
  }
}
