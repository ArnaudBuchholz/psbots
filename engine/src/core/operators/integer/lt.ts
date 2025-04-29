import { trueValue, falseValue } from '@api/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

buildFunctionOperator(
  {
    name: 'lt',
    description: 'compares two integers to see if lower than',
    labels: ['integer', 'math', 'comparison'],
    signature: {
      input: [{ type: 'integer' }, { type: 'integer' }],
      output: [{ type: 'boolean' }]
    },
    samples: [
      {
        in: '1 2 lt',
        out: 'true'
      },
      {
        in: '2 1 lt',
        out: 'false'
      }
    ]
  },
  ({ operands }, { integer: value1 }, { integer: value2 }) =>
    operands.popush(2, value1 < value2 ? trueValue : falseValue)
);
