import { assert, findMarkPos, toIntegerValue } from '@sdk/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

buildFunctionOperator(
  {
    name: 'counttomark',
    description: 'returns the number of items in the operand stack up to the first mark',
    labels: ['operand'],
    signature: {
      output: [{ type: 'integer' }]
    },
    samples: [
      {
        in: '1 mark 2 3 counttomark',
        out: '1 mark 2 3 2'
      },
      {
        description: 'fails if no mark is found',
        in: '1 2 3 counttomark',
        out: '1 2 3 unmatchedmark'
      }
    ]
  },

  ({ operands }) => {
    const posResult = findMarkPos(operands);
    if (!posResult.success) {
      return posResult;
    }
    const integerResult = toIntegerValue(posResult.value);
    assert(integerResult); // cannot exceed limit
    return operands.push(integerResult.value);
  }
);
