import { ValueType } from '@api/index.js';
import { toBooleanValue } from '@sdk/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

buildFunctionOperator(
  {
    name: 'lte',
    description: 'compares two integers to see if lower than or equal',
    labels: ['integer', 'math', 'comparison'],
    signature: {
      input: [{ type: ValueType.integer }, { type: ValueType.integer }],
      output: [{ type: ValueType.boolean }]
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
  ({ operands }, { integer: value1 }, { integer: value2 }) => operands.popush(2, toBooleanValue(value1 <= value2))
);
