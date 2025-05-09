import { trueValue, falseValue } from '@api/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

buildFunctionOperator(
  {
    name: 'lte',
    description: 'returns true of if the next integer is lower than or equal to the top one',
    labels: ['integer', 'math', 'comparison'],
    signature: {
      input: [{ type: 'integer' }, { type: 'integer' }],
      output: [{ type: 'boolean' }]
    },
    samples: [
      {
        in: '1 2 lte',
        out: 'true'
      },
      {
        in: '2 1 lte',
        out: 'false'
      },
      {
        in: '1 1 lte',
        out: 'true'
      }
    ]
  },
  ({ operands }, { integer: value1 }, { integer: value2 }) =>
    operands.popush(2, value1 <= value2 ? trueValue : falseValue)
);
