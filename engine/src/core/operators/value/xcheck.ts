import { ValueType } from '@api/index.js';
import type { Value } from '@api/index.js';
import { toBooleanValue } from '@sdk/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

buildFunctionOperator(
  {
    name: 'xcheck',
    description: 'checks if value is executable',
    labels: ['value', 'generic', 'permission'],
    signature: {
      input: [null],
      output: [ValueType.boolean]
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
  ({ operands }, value: Value) => {
    operands.pop();
    operands.push(toBooleanValue(value.isExecutable));
  }
);
