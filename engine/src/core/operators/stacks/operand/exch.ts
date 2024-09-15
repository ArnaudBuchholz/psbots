import type { Value } from '@api/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

buildFunctionOperator(
  {
    name: 'exch',
    description: 'swaps the first two items of the operand stack',
    labels: ['operand'],
    signature: {
      input: [null, null],
      output: [null, null]
    },
    samples: [
      {
        in: '1 2 3 exch',
        out: '1 3 2'
      }
    ]
  },
  ({ operands }, value1: Value, value2: Value) => {
    operands.pop();
    operands.pop();
    operands.push(value2);
    operands.push(value1);
  }
);
