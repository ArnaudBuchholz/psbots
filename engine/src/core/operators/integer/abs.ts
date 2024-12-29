import { ValueType } from '@api/index.js';
import { toIntegerValue } from '@sdk/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

buildFunctionOperator(
  {
    name: 'abs',
    description: 'returns absolute values of an integer',
    labels: ['integer', 'math'],
    signature: {
      input: [{ type: ValueType.integer }],
      output: [{ type: ValueType.integer }]
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
  (state, { integer: value }) => {
    const { operands } = state;
    if (value < 0) {
      const integerResult = toIntegerValue(-value);
      if (!integerResult.success) {
        return integerResult;
      }
      return operands.popush(1, integerResult.value);
    }
    return { success: true, value: undefined };
  }
);
