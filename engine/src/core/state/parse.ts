import type { Value } from '@api/index.js';
import { ValueType, parse } from '@api/index.js';
import type { IInternalState } from '@sdk/index.js';
import { OPERATOR_STATE_FIRST_CALL, OPERATOR_STATE_UNKNOWN, valuesOf } from '@sdk/index.js';
import type { MemoryTracker } from '@core/MemoryTracker.js';

const UNKNOWN_FILENAME = 'unknown';

function getToken(state: IInternalState, value: Value<ValueType.string>): Value | undefined {
  const { calls } = state;
  if (calls.topOperatorState === OPERATOR_STATE_UNKNOWN) {
    calls.topOperatorState = OPERATOR_STATE_FIRST_CALL;
    const [first] = parse(value.string, { pos: 0, filename: value.debugSource?.filename ?? UNKNOWN_FILENAME });
    return first;
  } else {
    const [, second] = parse(value.string, { pos: calls.topOperatorState, filename: value.debugSource?.filename ?? UNKNOWN_FILENAME });
    return second;
  }
}

function enqueueToken(state: IInternalState, token: Value) {
  const { calls, operands } = state;
  const memoryTracker = state.memoryTracker as MemoryTracker;
  const { pos } = token.debugSource!; // as filename is specified
  if (pos > 0) {
    calls.topOperatorState = pos;
  }
  if (token.debugSource?.filename === UNKNOWN_FILENAME) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- better than copy & delete
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
  const pushed = token.isExecutable ? calls.push(token) : operands.push(token);
  if (string !== undefined) {
    memoryTracker.releaseString(string);
  }
  if (!pushed.success) {
    state.raiseException(pushed.exception);
  }
}

export function parseCycle(state: IInternalState, value: Value<ValueType.string>): void {
  const { calls } = state;
  const token = getToken(state, value);
  if (token) {
    enqueueToken(state, token);
  } else {
    calls.pop();
  }
}
