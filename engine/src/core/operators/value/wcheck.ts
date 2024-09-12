import { ValueType } from '@api/index.js';
import type { Value } from '@api/index.js';
import { toBooleanValue } from '@sdk/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

buildFunctionOperator(
  {
    name: 'wcheck',
    description: 'checks if value is writable',
    labels: ['value', 'generic', 'permission'],
    signature: {
      input: [null],
      output: [ValueType.boolean]
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
  ({ operands }, value: Value) => {
    operands.pop();
    operands.push(toBooleanValue(!value.isReadOnly));
  }
);
