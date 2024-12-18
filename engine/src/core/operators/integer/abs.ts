import { ValueType } from '@api/index.js';
import { toIntegerValue } from '@sdk/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

buildFunctionOperator(
  {
    name: 'abs',
    description: 'returns absolute values of an integer',
    labels: ['integer', 'math'],
    signature: {
      input: [ValueType.integer],
      output: [ValueType.integer]
    },
    samples: [
      {
        in: '1 abs',
        out: '1'
      },
      {
        in: '-1 abs',
        out: '1'
      }
    ]
  },
  (state, value: number) => {
    const { operands } = state;
    if (value < 0) {
      const integerResult = toIntegerValue(-value);
      if (!integerResult.success) {
        state.raiseException(integerResult.error);
        return;
      }
      operands.pop();
      operands.push(integerResult.value);
    }
  }
);
