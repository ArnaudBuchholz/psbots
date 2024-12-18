import { ValueType } from '@api/index.js';
import { toIntegerValue } from '@sdk/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

buildFunctionOperator(
  {
    name: 'add',
    description: 'adds two integers',
    labels: ['integer', 'math'],
    signature: {
      input: [ValueType.integer, ValueType.integer],
      output: [ValueType.integer]
    },
    samples: [
      {
        in: '1 2 add',
        out: '3'
      }
    ]
  },
  (state, value1: number, value2: number) => {
    const { operands } = state;
    const integerResult = toIntegerValue(value1 + value2);
    if (!integerResult.success) {
      state.raiseException(integerResult.error);
      return;
    }
    operands.pop();
    operands.pop();
    operands.push(integerResult.value);
  }
);
