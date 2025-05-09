import { falseValue, trueValue } from '@api/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

buildFunctionOperator(
  {
    name: 'gte',
    description: 'returns true of if the next integer is greater than or equal to the top one',
    labels: ['integer', 'math', 'comparison'],
    signature: {
      input: [{ type: 'integer' }, { type: 'integer' }],
      output: [{ type: 'boolean' }]
    },
    samples: [
      {
        in: '1 2 gte',
        out: 'false'
      },
      {
        in: '2 1 gte',
        out: 'true'
      },
      {
        in: '1 1 gte',
        out: 'true'
      }
    ]
  },
  ({ operands }, { integer: value1 }, { integer: value2 }) =>
    operands.popush(2, value1 >= value2 ? trueValue : falseValue)
);
