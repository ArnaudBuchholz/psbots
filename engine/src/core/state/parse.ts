import type { Value } from '@api/index.js';
import { parse, VALUE_TYPE } from '@api/index.js';
import type { IInternalState } from '@sdk/index.js';
import { OPERATOR_STATE_FIRST_CALL, OPERATOR_STATE_UNKNOWN, valuesOf } from '@sdk/index.js';
import type { MemoryTracker } from '@core/MemoryTracker.js';

const UNKNOWN_FILENAME = 'unknown';

function getToken(this: IInternalState, top: Value<'string'>): Value | undefined {
  const { calls } = this;
  if (calls.topOperatorState === OPERATOR_STATE_UNKNOWN) {
    calls.topOperatorState = OPERATOR_STATE_FIRST_CALL;
    const [first] = parse(top.string, { pos: 0, filename: top.debugSource?.filename ?? UNKNOWN_FILENAME });
    return first;
  } else {
    const [, second] = parse(top.string, {
      pos: calls.topOperatorState,
      filename: top.debugSource?.filename ?? UNKNOWN_FILENAME
    });
    return second;
  }
}

function enqueueToken(this: IInternalState, top: Value) {
  const { calls, operands } = this;
  const memoryTracker = this.memoryTracker as MemoryTracker;
  const { pos } = top.debugSource!; // as filename is specified
  if (pos > 0) {
    calls.topOperatorState = pos;
  }
  if (top.debugSource?.filename === UNKNOWN_FILENAME) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- better than copy & delete
    const { debugSource, ...tokenWithoutDebugSource } = top;
    top = tokenWithoutDebugSource;
  }
  let string: string | undefined;
  // Known value types names are not tracked
  if (top.type === 'string' || (top.type === 'name' && !Object.keys(VALUE_TYPE).includes(top.name))) {
    string = valuesOf(top)[0];
    const result = memoryTracker.addStringRef(string);
    if (!result.success) {
      this.raiseException(result.exception);
      return;
    }
    Object.assign(top, { tracker: memoryTracker });
  }
  const pushed = top.isExecutable ? calls.push(top) : operands.push(top);
  if (string !== undefined) {
    memoryTracker.releaseString(string);
  }
  if (!pushed.success) {
    this.raiseException(pushed.exception);
  }
}

export function parseCycle(this: IInternalState, top: Value<'string'>): void {
  const { calls } = this;
  const token = getToken.call(this, top);
  if (token) {
    enqueueToken.call(this, token);
  } else {
    calls.pop();
  }
}
