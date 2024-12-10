import { ValueType } from '@api/index.js';
import {
  TypeCheckException,
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
      input: [ValueType.array, ValueType.array], // TODO: how to identify executable code blocks
      output: []
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
  (state) => {
    const { operands, calls } = state;
    const { topOperatorState } = calls;
    if (topOperatorState === OPERATOR_STATE_FIRST_CALL) {
      const [finalBlock, codeBlock] = operands.ref;
      if (finalBlock === undefined || !finalBlock.isExecutable || codeBlock === undefined || !codeBlock.isExecutable) {
        throw new TypeCheckException();
      }
      calls.topOperatorState = OPERATOR_STATE_CALL_BEFORE_POP;
      // Since both operands are declared in the signature, their value remains valid during this call
      operands.pop();
      operands.pop();
      calls.def(CALLS_BLOCK, finalBlock);
      calls.push(codeBlock);
    } else if (topOperatorState === OPERATOR_STATE_CALL_BEFORE_POP) {
      calls.topOperatorState = -2;
      if (state.exception) {
        calls.def(CALLS_EXCEPTION, {
          type: ValueType.dictionary,
          isExecutable: false,
          isReadOnly: true,
          dictionary: state.exception
        });
        state.clearException();
      }
      const finalBlock = calls.lookup(CALLS_BLOCK);
      if (finalBlock) {
        finalBlock.tracker?.addValueRef(finalBlock);
        try {
          calls.push(finalBlock);
        } finally {
          finalBlock.tracker?.releaseValue(finalBlock);
        }
      }
    } else {
      const exception = calls.lookup(CALLS_EXCEPTION);
      if (exception && exception.type === ValueType.dictionary && !state.exception) {
        state.raiseException(exception.dictionary);
      }
      calls.topOperatorState = OPERATOR_STATE_POP;
    }
  }
);
