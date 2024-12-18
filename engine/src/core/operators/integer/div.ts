import { ValueType } from '@api/index.js';
import { toIntegerValue } from '@sdk/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

buildFunctionOperator(
  {
    name: 'div',
    description: 'realizes an euclidean division with two integers',
    labels: ['integer', 'math'],
    signature: {
      input: [ValueType.integer, ValueType.integer],
      output: [ValueType.integer, ValueType.integer]
    },
    samples: [
      {
        in: '5 3 div',
        out: '1 2'
      }
    ]
  },
  (state, value1: number, value2: number) => {
    const { operands } = state;
    // TODO: divide by 0
    const reminder = value1 % value2;
    const reminderResult = toIntegerValue(reminder);
    if (!reminderResult.success) {
      state.raiseException(reminderResult.error);
      return;
    }
    const dividendResult = toIntegerValue((value1 - reminder) / value2);
    if (!dividendResult.success) {
      state.raiseException(dividendResult.error);
      return;
    }
    operands.pop();
    operands.pop();
    operands.push(dividendResult.value);
    operands.push(reminderResult.value);
  }
);
