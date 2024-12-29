import { ValueType } from '@api/index.js';
import {
  OPERATOR_STATE_POP,
  OPERATOR_STATE_FIRST_CALL,
  OPERATOR_STATE_CALL_BEFORE_POP,
  StopException,
  assert
} from '@sdk/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

const CALLS_BLOCK = 'block';

buildFunctionOperator(
  {
    name: 'loop',
    description: 'repeatedly executes proc until proc executes the stop operator',
    labels: ['flow', 'loop'],
    signature: {
      input: [{ type: ValueType.array, permissions: { isExecutable: true } }]
    },
    samples: [
      {
        description: 'executes the block until stop',
        in: '{ 1 count 3 eq { stop } if } loop',
        out: '1 1 1'
      },
      {
        description: 'does not catch errors',
        in: '{ 1 typecheck } loop',
        out: '1 typecheck'
      },
      {
        description: 'fails on no code block',
        in: '[ 1 2 ] loop',
        out: '[ 1 2 ] typecheck'
      }
    ]
  },
  (state, codeBlock) => {
    const { operands, calls } = state;
    const { topOperatorState } = calls;
    if (topOperatorState === OPERATOR_STATE_FIRST_CALL) {
      calls.topOperatorState = OPERATOR_STATE_CALL_BEFORE_POP;
      calls.def(CALLS_BLOCK, codeBlock);
      operands.pop();
      return calls.push(codeBlock);
    } else if (topOperatorState === OPERATOR_STATE_CALL_BEFORE_POP) {
      if (state.exception) {
        if (state.exception instanceof StopException) {
          state.clearException();
        }
        calls.topOperatorState = OPERATOR_STATE_POP;
        return { success: true, value: undefined };
      }
      const codeBlock = calls.lookup(CALLS_BLOCK);
      return calls.push(codeBlock);
    }
    assert(false);
  }
);
