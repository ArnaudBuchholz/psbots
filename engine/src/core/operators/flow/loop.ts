import { ValueType } from '@api/index.js';
import {
  TypeCheckException,
  OPERATOR_STATE_POP,
  OPERATOR_STATE_FIRST_CALL,
  OPERATOR_STATE_CALL_BEFORE_POP,
  StopException
} from '@sdk/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

const CALLS_BLOCK = 'block';

buildFunctionOperator(
  {
    name: 'loop',
    description: 'repeatedly executes proc until proc executes the stop operator',
    labels: ['flow', 'loop'],
    signature: {
      input: [ValueType.array], // TODO: how to identify executable code blocks
      output: []
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
        out: '1typecheck'
      },
      {
        description: 'fails on no code block',
        in: '[ 1 2 ] loop',
        out: '[ 1 2 ] typecheck'
      }
    ]
  },
  (state) => {
    const { operands, calls } = state;
    const { topOperatorState } = calls;
    if (topOperatorState === OPERATOR_STATE_FIRST_CALL) {
      calls.topOperatorState = OPERATOR_STATE_CALL_BEFORE_POP;
      if (!operands.top.isExecutable) {
        throw new TypeCheckException();
      }
      const codeBlock = operands.top;
      calls.def(CALLS_BLOCK, codeBlock);
      operands.pop();
      calls.push(codeBlock);
    } else if (topOperatorState === OPERATOR_STATE_CALL_BEFORE_POP) {
      if (state.exception) {
        if (state.exception instanceof StopException) {
          state.exception = undefined;
        }
        calls.topOperatorState = OPERATOR_STATE_POP;
      } else {
        const codeBlock = calls.lookup(CALLS_BLOCK)!; // Should exist
        calls.push(codeBlock);
      }
    }
  }
);
