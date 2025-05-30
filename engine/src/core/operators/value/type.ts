import { toNameValue } from '@sdk/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

buildFunctionOperator(
  {
    name: 'type',
    description: 'returns the type of the value',
    labels: ['value', 'generic'],
    signature: {
      input: [{ type: 'null' }],
      output: [{ type: 'name' }]
    },
    samples: [
      {
        in: 'false type',
        out: '/boolean'
      },
      {
        in: '[ 1 2 3 ] type',
        out: '/array'
      },
      {
        in: '"" type',
        out: '/string'
      },
      {
        in: '/type type',
        out: '/name'
      }
    ]
  },
  ({ operands }, value) => operands.popush(1, toNameValue(value.type))
);
