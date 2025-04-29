import type { Exception, IReadOnlyCallStack, Result, Value } from '@api/index.js';
import { nullValue } from '@api/index.js';
import type { IInternalState } from '@sdk/index.js';
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

function firstCall(state: IInternalState, codeBlock: Value<'array'>, finalBlock: Value<'array'>): Result<unknown> {
  const { operands, calls } = state;
  const finalBlockDefined = calls.def(CALLS_BLOCK, finalBlock);
  if (!finalBlockDefined.success) {
    return finalBlockDefined;
  }
  calls.topOperatorState = OPERATOR_STATE_CALL_BEFORE_POP;
  const codeBlockDefined = calls.push(codeBlock);
  if (codeBlockDefined.success) {
    const popushResult = operands.popush(2);
    assert(popushResult);
  }
  return codeBlockDefined;
}

function callBeforePop(state: IInternalState): Result<unknown> {
  const { calls } = state;
  calls.topOperatorState = OPERATOR_STATE_POPPING;
  if (state.exception) {
    const exceptionDefined = calls.def(CALLS_EXCEPTION, toStringValue(state.exception));
    if (!exceptionDefined.success) {
      return exceptionDefined;
    }
    assert(state.exceptionStack instanceof CallStack);
    const stackDefined = calls.def(CALLS_EXCEPTION_STACK, state.exceptionStack.toValue());
    if (!stackDefined.success) {
      return stackDefined;
    }
    state.clearException();
  }
  const finalBlock = calls.lookup(CALLS_BLOCK);
  assert(finalBlock.type !== 'null');
  return calls.push(finalBlock);
}

function popping(state: IInternalState): Result<unknown> {
  const { calls } = state;
  if (state.exception === undefined) {
    const exception = calls.lookup(CALLS_EXCEPTION);
    if (exception !== nullValue) {
      assert(exception.type === 'string');
      const exceptionStack = calls.lookup(CALLS_EXCEPTION_STACK);
      assert(exceptionStack.type === 'array');
      state.raiseException(exception.string as Exception, exceptionStack.array as IReadOnlyCallStack);
    }
  }
  calls.topOperatorState = OPERATOR_STATE_POP;
  return { success: true, value: undefined };
}

buildFunctionOperator(
  {
    name: 'finally',
    description: 'executes the final block whenever the command block is unstacked',
    labels: ['flow'],
    signature: {
      input: [
        { type: 'array', permissions: { isExecutable: true } },
        { type: 'array', permissions: { isExecutable: true } }
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
    const { topOperatorState } = state.calls;
    if (topOperatorState === OPERATOR_STATE_FIRST_CALL) {
      return firstCall(state, codeBlock, finalBlock);
    }
    if (topOperatorState === OPERATOR_STATE_CALL_BEFORE_POP) {
      return callBeforePop(state);
    }
    assert(topOperatorState === OPERATOR_STATE_POPPING);
    return popping(state);
  }
);
