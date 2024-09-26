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
import { TypeCheckException, STEP_POP, toBooleanValue } from '@sdk/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

const CALLS_BLOCK = 'block';
const CALLS_EXCEPTION = 'exception';
const CALLS_POP = 'pop';

buildFunctionOperator(
  {
    name: 'finally',
    description: 'executes the final block whenever the command block is unstacked',
    labels: ['flow'],
    signature: {
      input: [ValueType.array, ValueType.array], // TODO: how to identify executable code blocks
      output: []
    },
    callOnPop: true,
    samples: [
      // {
      //   description: 'always executes the final block',
      //   in: '{ 1 2 } { 3 } finally',
      //   out: '1 2 3'
      // },
      // {
      //   description: 'does not prevent exception but enables post processing',
      //   in: '{ 1 undefined 2 } { 3 } finally',
      //   out: '1 3 undefined'
      // },
      {
        description: 'throws the last error',
        in: '{ 1 stackunderflow 2 } { 3 undefined 4 } finally',
        out: '1 3 undefined'
      }
    ]
  },
  (state) => {
    const { operands, calls } = state;
    const { step } = calls;
    if (step === STEP_POP) {
      if (calls.lookup(CALLS_POP) !== null) {
        const exception = calls.lookup(CALLS_EXCEPTION);
        if (exception && exception.type === ValueType.dictionary && !state.exception) {
          state.exception = exception.dictionary as BaseException;
        }
        calls.pop();
      } else {
        calls.def(CALLS_POP, toBooleanValue(true));
        if (state.exception) {
          calls.def(CALLS_EXCEPTION, {
            type: ValueType.dictionary,
            isExecutable: false,
            isReadOnly: true,
            dictionary: state.exception
          });
          state.exception = undefined;
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
      }
    } else {
      const [finalBlock, codeBlock] = operands.ref!;
      if (finalBlock === undefined || !finalBlock.isExecutable || codeBlock === undefined || !codeBlock.isExecutable) {
        throw new TypeCheckException();
      }
      // Since both operands are declared in the signature, their value remains valid during this call
      operands.pop();
      operands.pop();
      calls.def(CALLS_BLOCK, finalBlock);
      calls.push(codeBlock);
    }
  }
);
