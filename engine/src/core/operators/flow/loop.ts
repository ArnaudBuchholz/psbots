import { OPERATOR_STATE_POP, OPERATOR_STATE_FIRST_CALL, OPERATOR_STATE_CALL_BEFORE_POP, assert } from '@sdk/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

const LOOP_BLOCK = 'block';

buildFunctionOperator(
  {
    name: 'loop',
    description: 'repeatedly executes the block until it calls stop',
    labels: ['flow', 'loop'],
    signature: {
      input: [{ type: 'array', permissions: { isExecutable: true } }]
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
      const defined = calls.def(LOOP_BLOCK, codeBlock);
      if (!defined.success) {
        return defined;
      }
      operands.pop();
      return calls.push(codeBlock);
    }
    assert(topOperatorState === OPERATOR_STATE_CALL_BEFORE_POP);
    if (state.exception) {
      if (state.exception === 'stop') {
        state.clearException();
      }
      calls.topOperatorState = OPERATOR_STATE_POP;
      return { success: true, value: undefined };
    }
    const loopBlock = calls.lookup(LOOP_BLOCK);
    return calls.push(loopBlock);
  }
);
