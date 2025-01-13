import type { Result, Value } from '@api/index.js';
import { ValueType, parse } from '@api/index.js';
import type { IInternalState } from '@sdk/index.js';
import { OPERATOR_STATE_FIRST_CALL, OPERATOR_STATE_UNKNOWN, valuesOf } from '@sdk/index.js';
import type { MemoryTracker } from '@core/MemoryTracker.js';

const UNKNOWN_FILENAME = 'unknown';

export function parseCycle(state: IInternalState, value: Value<ValueType.string>): void {
  const { calls, operands } = state;
  const memoryTracker = state.memoryTracker as MemoryTracker;
  let token: Value | undefined;
  if (calls.topOperatorState === OPERATOR_STATE_UNKNOWN) {
    calls.topOperatorState = OPERATOR_STATE_FIRST_CALL;
    const [first] = parse(value.string, 0, value.debugSource?.filename ?? UNKNOWN_FILENAME);
    token = first;
  } else {
    const [, second] = parse(value.string, calls.topOperatorState, value.debugSource?.filename ?? UNKNOWN_FILENAME);
    token = second;
  }
  if (!token) {
    calls.pop();
  } else {
    const { pos } = token.debugSource!; // as filename is specified
    if (pos > 0) {
      calls.topOperatorState = pos;
    }
    if (token.debugSource?.filename === UNKNOWN_FILENAME) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { debugSource, ...tokenWithoutDebugSource } = token;
      token = tokenWithoutDebugSource;
    }
    let string: string | undefined;
    if (token.type === ValueType.string || token.type === ValueType.name) {
      string = valuesOf(token)[0];
      const result = memoryTracker.addStringRef(string);
      if (!result.success) {
        state.raiseException(result.exception);
        return;
      }
      Object.assign(token, { tracker: memoryTracker });
    }
    let pushResult: Result<number>;
    if (token.isExecutable) {
      pushResult = calls.push(token);
    } else {
      pushResult = operands.push(token);
    }
    if (string !== undefined) {
      memoryTracker.releaseString(string);
    }
    if (!pushResult.success) {
      state.raiseException(pushResult.exception);
    }
  }
}
