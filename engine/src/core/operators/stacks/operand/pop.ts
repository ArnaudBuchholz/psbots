import { buildFunctionOperator } from '@core/operators/operators.js';

buildFunctionOperator(
  {
    name: 'pop',
    description: 'removes the top item of the operand stack',
    labels: ['operand'],
    signature: {
      input: [null],
      output: []
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
