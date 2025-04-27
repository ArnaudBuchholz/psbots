import { ValueType, trueValue, falseValue } from '@api/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

buildFunctionOperator(
  {
    name: 'wcheck',
    description: 'checks if value is writable',
    labels: ['value', 'generic', 'permission'],
    signature: {
      input: [{ type: ValueType.null }],
      output: [{ type: ValueType.boolean }]
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
  ({ operands }, value) => operands.popush(1, !value.isReadOnly ? trueValue : falseValue)
);
