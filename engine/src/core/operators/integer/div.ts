import { toIntegerValue } from '@sdk/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

buildFunctionOperator(
  {
    name: 'div',
    description: 'returns quotient and remainder of the euclidean division of two integers',
    labels: ['integer', 'math'],
    signature: {
      input: [{ type: 'integer' }, { type: 'integer' }],
      output: [{ type: 'integer' }, { type: 'integer' }]
    },
    samples: [
      {
        in: '5 3 div',
        out: '1 2'
      },
      {
        in: '5 0 div',
        out: 'undefinedresult'
      }
    ]
  },
  (state, { integer: divisor }, { integer: quotient }) => {
    const { operands } = state;
    if (quotient === 0) {
      return { success: false, exception: 'undefinedResult' };
    }
    const reminder = divisor % quotient;
    const reminderResult = toIntegerValue(reminder);
    if (!reminderResult.success) {
      return reminderResult;
    }
    const dividendResult = toIntegerValue((divisor - reminder) / quotient);
    if (!dividendResult.success) {
      return dividendResult;
    }
    return operands.popush(2, dividendResult.value, reminderResult.value);
  }
);
