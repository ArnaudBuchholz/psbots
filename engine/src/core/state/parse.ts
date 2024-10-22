import type { Value, ValueType } from '@api/index.js';
import { parse } from '@api/index.js';
import { OPERATOR_STATE_FIRST_CALL, OPERATOR_STATE_UNKNOWN } from '@sdk/index.js';
import type { IInternalState } from '@sdk/index.js';

const UNKNOWN_FILENAME = 'unknown';

export function parseCycle({ calls, operands }: IInternalState, value: Value<ValueType.string>): void {
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
    if (token.isExecutable) {
      calls.push(token);
    } else {
      operands.push(token);
    }
  }
}
