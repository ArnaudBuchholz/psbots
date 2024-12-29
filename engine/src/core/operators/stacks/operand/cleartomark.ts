import { findMarkPos } from '@sdk/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

buildFunctionOperator(
  {
    name: 'cleartomark',
    description: 'clears the operand stack up to the first mark',
    labels: ['operand', 'mark'],
    samples: [
      {
        in: '1 mark 2 3 cleartomark',
        out: '1'
      },
      {
        description: 'fails if no mark is found',
        in: '1 2 3 cleartomark',
        out: '1 2 3 unmatchedmark'
      }
    ]
  },

  ({ operands }) => {
    const markPosResult = findMarkPos(operands);
    if (!markPosResult.success) {
      return markPosResult;
    }
    let markPos = markPosResult.value;
    while (markPos-- > 0) {
      operands.pop();
    }
    operands.pop();
    return { success: true, value: undefined };
  }
);
