import { buildFunctionOperator } from '@core/operators/operators.js';

buildFunctionOperator(
  {
    name: 'clear',
    description: 'clears the operand stack',
    labels: ['operand'],
    signature: {
      input: [],
      output: []
    },
    samples: [
      {
        in: '1 2 3 clear',
        out: ''
      }
    ]
  },
  ({ operands }) => {
    while (operands.length) {
      operands.pop();
    }
  }
);
