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
  (state) => {
    const { operands } = state;
    const integerResult = toIntegerValue(operands.length);
    if (!integerResult.success) {
      state.raiseException(integerResult.error);
      return;
    }
    operands.push(integerResult.value);
  }
);
