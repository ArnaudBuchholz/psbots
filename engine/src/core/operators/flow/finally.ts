/**
 * if exception
 *
 * finally:
 *   store the exception while the subsequent code is executed
 *   replace with finally-finalized
 *   push subsequent code
 *
 * finally-finalized:
 *   if no exception and one is stored, throw it
 */

/**
 * if no exception
 *
 * finally:
 *   replace with finally-finalized
 *   push subsequent code
 *
 * finally-finalized:
 *   if exception => raise it
 */

import { ValueType } from '@api/index.js';
import type { BaseException } from '@sdk/index.js';
import { TypeCheckException, STEP_DONE, STEP_POP } from '@sdk/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

const onPop = buildFunctionOperator(
  {
    name: 'finally/onPop',
    description: 'implements the finally operator when popped from the call stack',
    labels: ['flow'],
    internal: true,
    callOnPop: true,
    signature: {
      input: [],
      output: []
    },
    samples: []
  },
  (state) => {
    const { calls } = state;
    const { step } = calls;
    if (step === STEP_POP) {
      calls.step = 0;
      if (state.exception) {
        calls.def('exception', {
          type: ValueType.dictionary,
          isExecutable: false,
          isReadOnly: true,
          dictionary: state.exception
        });
        state.exception = undefined;
      }
      const finalBlock = calls.lookup('block');
      calls.push(finalBlock!);
    } else if (step === 0) {
      const exception = calls.lookup('exception');
      if (exception && exception.type === ValueType.dictionary && !state.exception) {
        state.exception = exception.dictionary as BaseException;
      }
      calls.step = STEP_DONE;
    }
  }
);

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
      }
    ]
  },
  ({ operands, calls }) => {
    const [finalBlock, codeBlock] = operands.ref!;
    if (finalBlock === undefined || !finalBlock.isExecutable || codeBlock === undefined || !codeBlock.isExecutable) {
      throw new TypeCheckException();
    }
    // Since both operands are declared in the signature, their value remains valid during this
    operands.pop();
    operands.pop();
    const finalOp = calls.top;
    calls.pop();
    if (finalOp.debugSource) {
      calls.push(Object.assign({}, finalOp, { debugSource: finalOp.debugSource }));
    } else {
      calls.push(onPop);
    }
    calls.def('block', finalBlock);
    calls.push(codeBlock);
  }
);
