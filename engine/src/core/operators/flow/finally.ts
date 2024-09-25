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
import { buildFunctionOperator } from '@core/operators/operators.js';



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
        out: '1 3'
      },
      {
        description: 'throws the last error',
        in: '{ 1 stackunderflow 2 } { 3 undefined 4 } finally',
        out: '1 3 undefined'
      }
    ]
  },
  ({ operands, calls }) => {
    const finalBlock = operands.top;
    operands.pop();
    const codeBlock = operands.top;
    operands.pop();

    calls.pop();
    calls.push('finally-finalized');
    calls.def('')
    const { step } = calls;

  }
);
