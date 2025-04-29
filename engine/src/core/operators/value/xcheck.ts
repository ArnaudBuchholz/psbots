import { trueValue, falseValue } from '@api/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

buildFunctionOperator(
  {
    name: 'xcheck',
    description: 'checks if value is executable',
    labels: ['value', 'generic', 'permission'],
    signature: {
      input: [{ type: 'null' }],
      output: [{ type: 'boolean' }]
    },
    samples: [
      {
        description: 'returns true for blocks',
        in: '{ 1 2 } xcheck',
        out: 'true'
      },
      {
        description: 'returns false for arrays',
        in: '[ 1 2 ] xcheck',
        out: 'false'
      }
    ]
  },
  ({ operands }, value) => operands.popush(1, value.isExecutable ? trueValue : falseValue)
);
