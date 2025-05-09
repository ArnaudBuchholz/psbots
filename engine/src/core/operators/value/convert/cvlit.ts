import type { Value } from '@api/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

buildFunctionOperator(
  {
    name: 'cvlit',
    description: 'converts to non executable',
    labels: ['value', 'generic', 'conversion'],
    signature: {
      input: [{ type: 'null' }],
      output: [{ type: 'null', permissions: { isExecutable: false } }]
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
      return operands.popush(1, { ...value, isExecutable: false } as Value);
    }
    return { success: true, value: undefined };
  }
);
