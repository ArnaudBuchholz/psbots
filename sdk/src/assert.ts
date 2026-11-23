export class AssertionFailed extends Error {
  constructor(message: string, cause: unknown) {
    super(message);
    this.name = 'AssertionFailed';
    this.cause = cause;
  }
}

export function assert(isConditionTrue: boolean, message?: string, cause?: unknown): asserts isConditionTrue {
  if (!isConditionTrue) {
    throw new AssertionFailed(message ?? 'assertion failed', cause);
  }
}
