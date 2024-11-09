import { BaseException } from '@sdk/exceptions/BaseException.js';

class AssertException extends BaseException {
  constructor(message: string, cause: unknown) {
    super(message);
    this.cause = cause;
  }
}

export function assert(condition: boolean, message: string, cause?: unknown): asserts condition {
  if (!condition) {
    throw new AssertException(message, cause);
  }
}
