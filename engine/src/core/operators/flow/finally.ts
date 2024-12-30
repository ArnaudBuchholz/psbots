import { ValueType } from '@api/index.js';
import {
  OPERATOR_STATE_POP,
  OPERATOR_STATE_FIRST_CALL,
  OPERATOR_STATE_CALL_BEFORE_POP
} from '@sdk/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

const CALLS_BLOCK = 'block';
const CALLS_EXCEPTION = 'exception';

buildFunctionOperator(
  {
    name: 'finally',
    description: 'executes the final block whenever the command block is unstacked',
    labels: ['flow'],
    signature: {
      input: [
        { type: ValueType.array, permissions: { isExecutable: true } },
        { type: ValueType.array, permissions: { isExecutable: true } }
      ]
    },
    samples: [
      {
        description: 'always executes the final block',
        in: '{ 1 2 } { 3 } finally',
        out: '1 2 3'
      },
      {
        description: 'does not prevent exception but enables post processing',
        in: '{ 1 undefined 2 } { 3 } finally',
        out: '1 3 undefined'
      },
      {
        description: 'throws the last error',
        in: '{ 1 stackunderflow 2 } { 3 undefined 4 } finally',
        out: '1 3 undefined'
      },
      {
        description: 'fails on no code block',
        in: '[ 1 2 ] { 3 } finally',
        out: '[ 1 2 ] { 3 } typecheck'
      }
    ]
  },
  (state, codeBlock, finalBlock) => {
    const { operands, calls } = state;
    const { topOperatorState } = calls;
    if (topOperatorState === OPERATOR_STATE_FIRST_CALL) {
      calls.topOperatorState = OPERATOR_STATE_CALL_BEFORE_POP;
      const defResult = calls.def(CALLS_BLOCK, finalBlock);
      if (!defResult.success) {
        return defResult;
      }
      operands.popush(2);
      return calls.push(codeBlock);
    } else if (topOperatorState === OPERATOR_STATE_CALL_BEFORE_POP) {
      calls.topOperatorState = -2;
      if (state.exception) {
        const defResult = calls.def(CALLS_EXCEPTION, {
          type: ValueType.dictionary,
          isExecutable: false,
          isReadOnly: true,
          dictionary: state.exception
        });
        if (!defResult.success) {
          return defResult;
        }
        state.clearException();
      }
      const finalBlock = calls.lookup(CALLS_BLOCK);
      return calls.push(finalBlock);
    } else {
      const exception = calls.lookup(CALLS_EXCEPTION);
      if (exception.type === ValueType.dictionary && !state.exception) {
        state.raiseException(exception.dictionary);
      }
      calls.topOperatorState = OPERATOR_STATE_POP;
      return { success: true, value: undefined };
    }
  }
);
