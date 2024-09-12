import { ValueType } from '@api/index.js';
import { toIntegerValue } from '@sdk/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

buildFunctionOperator(
  {
    name: 'count',
    description: 'gives back the size of the operand stack',
    labels: ['operand'],
    signature: {
      input: [],
      output: [ValueType.integer]
    },
    samples: [
      {
        in: '1 2 3 count',
        out: '1 2 3 3'
      }
    ]
  },
  ({ operands }) => {
    operands.push(toIntegerValue(operands.length));
  }
);
