import type { Value } from '@api/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

buildFunctionOperator(
  {
    name: 'dup',
    description: 'duplicates the top value of the operand stack',
    labels: ['operand'],
    signature: {
      input: [{ type: 'null' }],
      output: [{ type: 'null' }, { type: 'null' }]
    },
    samples: [
      {
        in: '1 2 3 dup',
        out: '1 2 3 3'
      }
    ]
  },
  ({ operands }, value: Value) => operands.push(value)
);
