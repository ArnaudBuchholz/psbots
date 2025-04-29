import { falseValue, trueValue } from '@api/index.js';
import { OPERATOR_STATE_POP, OPERATOR_STATE_FIRST_CALL, OPERATOR_STATE_CALL_BEFORE_POP, assert } from '@sdk/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

buildFunctionOperator(
  {
    name: 'stopped',
    description: 'executes the value. If execution was interrupted with stop, return true, return false otherwise',
    labels: ['flow'],
    signature: {
      input: [{ type: 'null' }]
    },
    samples: [
      {
        in: '{ 1 2 3 } stopped',
        out: '1 2 3 false'
      },
      {
        in: '{ 1 2 stop 3 } stopped',
        out: '1 2 true'
      },
      {
        in: '{ 1 2 typecheck 3 } stopped',
        out: '1 2 typecheck'
      }
    ]
  },
  (state, value) => {
    const { operands, calls } = state;
    const { topOperatorState } = calls;
    if (topOperatorState === OPERATOR_STATE_FIRST_CALL) {
      calls.topOperatorState = OPERATOR_STATE_CALL_BEFORE_POP;
      const result = calls.push(value);
      if (result.success) {
        operands.pop();
      }
      return result;
    }
    assert(topOperatorState === OPERATOR_STATE_CALL_BEFORE_POP);
    calls.topOperatorState = OPERATOR_STATE_POP;
    if (!state.exception) {
      return operands.push(falseValue);
    }
    if (state.exception === 'stop') {
      state.clearException();
      return operands.push(trueValue);
    }
    // Unexpected exception
    return { success: true, value: undefined };
  }
);
