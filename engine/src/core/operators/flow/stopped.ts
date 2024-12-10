import {
  OPERATOR_STATE_POP,
  OPERATOR_STATE_FIRST_CALL,
  OPERATOR_STATE_CALL_BEFORE_POP,
  toBooleanValue,
  StopException
} from '@sdk/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

buildFunctionOperator(
  {
    name: 'stopped',
    description: 'executes the value. If execution was interrupted with stop, return true, return false otherwise',
    labels: ['flow'],
    signature: {
      input: [null],
      output: []
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
  (state) => {
    const { operands, calls } = state;
    const { topOperatorState } = calls;
    if (topOperatorState === OPERATOR_STATE_FIRST_CALL) {
      calls.topOperatorState = OPERATOR_STATE_CALL_BEFORE_POP;
      calls.push(operands.top);
      operands.pop();
    } else if (topOperatorState === OPERATOR_STATE_CALL_BEFORE_POP) {
      if (!state.exception) {
        operands.push(toBooleanValue(false));
      } else if (state.exception instanceof StopException) {
        state.clearException();
        operands.push(toBooleanValue(true));
      }
      calls.topOperatorState = OPERATOR_STATE_POP;
    }
  }
);
