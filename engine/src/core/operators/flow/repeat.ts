import type { IntegerValue, Result, Value } from '@api/index.js';
import type { IInternalState } from '@sdk/index.js';
import { OPERATOR_STATE_POP, OPERATOR_STATE_FIRST_CALL } from '@sdk/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

export const REPEAT_VALUE = 'value';

function firstCall(state: IInternalState, countValue: IntegerValue, value: Value): Result<unknown> {
  const { operands, calls } = state;
  const { integer: count } = countValue;
  if (count < 0) {
    return { success: false, exception: 'rangeCheck' };
  }
  if (count !== 0) {
    const valueDefined = calls.def(REPEAT_VALUE, value);
    if (!valueDefined.success) {
      return valueDefined;
    }
  }
  const popushed = operands.popush(2);
  if (!popushed.success) {
    return popushed;
  }
  calls.topOperatorState = count + 1;
  return { success: true, value: undefined };
}

function repeat(state: IInternalState): Result<unknown> {
  const { calls } = state;
  const { topOperatorState: count } = state.calls;
  // As we can't revert OPERATOR_STATE_POP, we need an additional step
  if (count === 1) {
    calls.topOperatorState = OPERATOR_STATE_POP;
    return { success: true, value: undefined };
  }
  --calls.topOperatorState;
  const pushed = calls.push(calls.lookup(REPEAT_VALUE));
  if (!pushed.success) {
    calls.topOperatorState = count;
    return pushed;
  }
  return { success: true, value: undefined };
}

buildFunctionOperator(
  {
    name: 'repeat',
    description: 'executes the top value n times, where n is a non-negative integer',
    labels: ['flow', 'loop'],
    signature: {
      input: [{ type: 'integer' }, { type: 'null' }]
    },
    samples: [
      {
        in: '4 { "abc" } repeat',
        out: '"abc" "abc" "abc" "abc"'
      },
      {
        in: '4 "abc" repeat',
        out: '"abc" "abc" "abc" "abc"'
      },
      {
        in: 'mark 0 { "abc" } repeat',
        out: 'mark'
      },
      {
        description: 'fails negative integer',
        in: '-1 { "abc" } repeat',
        out: '-1 { "abc" } rangecheck'
      },
      {
        description: 'fails on non integer',
        in: '"abc" { "abc" } repeat',
        out: '"abc" { "abc" } typecheck'
      }
    ]
  },
  (state, countValue, value) => {
    const { topOperatorState } = state.calls;
    if (topOperatorState === OPERATOR_STATE_FIRST_CALL) {
      return firstCall(state, countValue, value);
    }
    return repeat(state);
  }
);
