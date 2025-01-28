import type { Exception, IReadOnlyCallStack } from '@api/index.js';
import { nullValue, ValueType } from '@api/index.js';
import {
  OPERATOR_STATE_POP,
  OPERATOR_STATE_FIRST_CALL,
  OPERATOR_STATE_CALL_BEFORE_POP,
  toStringValue,
  assert
} from '@sdk/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';
import { CallStack } from '@core/objects/stacks/CallStack.js';

const CALLS_BLOCK = 'block';
export const CALLS_EXCEPTION = 'exception';
const CALLS_EXCEPTION_STACK = 'stack';
export const OPERATOR_STATE_POPPING = -2;

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
      const defResult = calls.def(CALLS_BLOCK, finalBlock);
      if (!defResult.success) {
        return defResult;
      }
      calls.topOperatorState = OPERATOR_STATE_CALL_BEFORE_POP;
      const callResult = calls.push(codeBlock);
      if (callResult.success) {
        const popushResult = operands.popush(2);
        assert(popushResult);
      }
      return callResult;
    }
    if (topOperatorState === OPERATOR_STATE_CALL_BEFORE_POP) {
      calls.topOperatorState = OPERATOR_STATE_POPPING;
      if (state.exception) {
        const defExceptionResult = calls.def(CALLS_EXCEPTION, toStringValue(state.exception));
        if (!defExceptionResult.success) {
          return defExceptionResult;
        }
        assert(state.exceptionStack instanceof CallStack);
        const defExceptionStackResult = calls.def(CALLS_EXCEPTION_STACK, state.exceptionStack.toValue());
        if (!defExceptionStackResult.success) {
          return defExceptionStackResult;
        }
        state.clearException();
      }
      const finalBlock = calls.lookup(CALLS_BLOCK);
      assert(finalBlock.type !== ValueType.null);
      return calls.push(finalBlock);
    }
    assert(topOperatorState === OPERATOR_STATE_POPPING);
    if (state.exception === undefined) {
      const exception = calls.lookup(CALLS_EXCEPTION);
      if (exception !== nullValue) {
        assert(exception.type === ValueType.string);
        const exceptionStack = calls.lookup(CALLS_EXCEPTION_STACK);
        assert(exceptionStack.type === ValueType.array);
        state.raiseException(exception.string as Exception, exceptionStack.array as IReadOnlyCallStack);
      }
    }
    calls.topOperatorState = OPERATOR_STATE_POP;
    return { success: true, value: undefined };
  }
);
