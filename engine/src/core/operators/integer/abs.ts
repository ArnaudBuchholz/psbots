import { ValueType } from '@api/index.js';
import { toIntegerValue } from '@sdk/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

buildFunctionOperator(
  {
    name: 'abs',
    description: 'returns absolute values of an integer',
    labels: ['integer', 'math'],
    signature: {
      input: [ValueType.integer],
      output: [ValueType.integer]
    },
    samples: [
      {
        in: '1 abs',
        out: '1'
      },
      {
        in: '-1 abs',
        out: '1'
      }
    ]
  },
  ({ operands }, value: number) => {
    if (value < 0) {
      operands.pop();
      operands.push(toIntegerValue(-value));
    }
  }
);
