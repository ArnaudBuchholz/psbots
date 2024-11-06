import type { Value } from '@api/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

buildFunctionOperator(
  {
    name: 'cvlit',
    description: 'removes executable flag',
    labels: ['value', 'generic', 'conversion'],
    signature: {
      input: [null],
      output: [null]
    },
    samples: [
      {
        in: '1 cvlit',
        out: '1'
      },
      {
        description: 'converts a block to a read-only array',
        in: '{ 1 } cvlit dup xcheck exch wcheck',
        out: 'false false'
      },
      {
        description: 'converts a call to a name',
        in: '{ test } 0 get cvlit',
        out: '/test'
      }
    ]
  },
  ({ operands }, value: Value) => {
    if (value.isExecutable) {
      const newValue = {
        ...value,
        isExecutable: false
      } as Value;
      operands.pop();
      operands.push(newValue);
    }
  }
);
