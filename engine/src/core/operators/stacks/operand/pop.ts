import { buildFunctionOperator } from '@core/operators/operators.js';

export const pop = buildFunctionOperator(
  {
    name: 'pop',
    description: 'removes the top value of the operand stack',
    labels: ['operand'],
    signature: {
      input: [{ type: 'null' }]
    },
    samples: [
      {
        in: '1 2 3 pop',
        out: '1 2'
      }
    ]
  },
  ({ operands }) => operands.pop()
);
