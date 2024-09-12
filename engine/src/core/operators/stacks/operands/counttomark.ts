import { ValueType } from '@api/index.js';
import { findMarkPos, toIntegerValue } from '@sdk/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

buildFunctionOperator(
  {
    name: 'counttomark',
    description: 'count the number of items in the operand stack up to the first mark',
    labels: ['operand'],
    signature: {
      input: [],
      output: [ValueType.integer]
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
    operands.push(toIntegerValue(findMarkPos(operands)));
  }
);
