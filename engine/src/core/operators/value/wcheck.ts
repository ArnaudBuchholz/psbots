import { trueValue, falseValue } from '@api/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

buildFunctionOperator(
  {
    name: 'wcheck',
    description: 'returns true if the value is writable',
    labels: ['value', 'generic', 'permission'],
    signature: {
      input: [{ type: 'null' }],
      output: [{ type: 'boolean' }]
    },
    samples: [
      {
        description: 'returns false for blocks',
        in: '{ 1 2 } wcheck',
        out: 'false'
      },
      {
        description: 'returns true for arrays',
        in: '[ 1 2 ] wcheck',
        out: 'true'
      }
    ]
  },
  ({ operands }, value) => operands.popush(1, value.isReadOnly ? falseValue : trueValue)
);
