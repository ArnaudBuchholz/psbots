import { ValueType } from '@api/index.js';
import { toIntegerValue } from '@sdk/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

buildFunctionOperator(
  {
    name: 'count',
    description: 'gives back the size of the operand stack',
    labels: ['operand'],
    signature: {
      output: [{ type: ValueType.integer }]
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
    if (!integerResult.success) {
      return integerResult;
    }
    return operands.push(integerResult.value);
  }
);
