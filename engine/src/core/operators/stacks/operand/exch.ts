import { buildFunctionOperator } from '@core/operators/operators.js';

buildFunctionOperator(
  {
    name: 'exch',
    description: 'swaps the first two values of the operand stack',
    labels: ['operand'],
    signature: {
      input: [{ type: 'null' }, { type: 'null' }],
      output: [{ type: 'null' }, { type: 'null' }]
    },
    samples: [
      {
        in: '1 2 3 exch',
        out: '1 3 2'
      },
      {
        in: 'mark [] <<>> exch',
        out: 'mark <<>> []'
      }
    ]
  },
  ({ operands }) => operands.swap(0, 1)
);
