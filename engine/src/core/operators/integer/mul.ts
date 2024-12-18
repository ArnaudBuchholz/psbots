import { ValueType } from '@api/index.js';
import { toIntegerValue } from '@sdk/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

buildFunctionOperator(
  {
    name: 'mul',
    description: 'multiplies two integers',
    labels: ['integer', 'math'],
    signature: {
      input: [ValueType.integer, ValueType.integer],
      output: [ValueType.integer]
    },
    samples: [
      {
        in: '3 4 mul',
        out: '12'
      }
    ]
  },
  (state, value1: number, value2: number) => {
    const { operands } = state;
    const integerResult = toIntegerValue(value1 * value2);
    if (!integerResult.success) {
      state.raiseException(integerResult.error);
      return;
    }
    operands.pop();
    operands.pop();
    operands.push(integerResult.value);
  }
);
