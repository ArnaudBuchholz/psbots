import { assert, toIntegerValue } from '@sdk/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

buildFunctionOperator(
  {
    name: 'count',
    description: 'returns the size of the operand stack',
    labels: ['operand'],
    signature: {
      output: [{ type: 'integer' }]
    },
    samples: [
      {
        in: '1 2 3 count',
        out: '1 2 3 3'
      }
    ]
  },
  ({ operands }) => {
    const integerResult = toIntegerValue(operands.length);
    assert(integerResult.success); // cannot exceed limit
    return operands.push(integerResult.value);
  }
);
