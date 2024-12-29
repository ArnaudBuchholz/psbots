import { enumIArrayValues, ValueType } from '@api/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

buildFunctionOperator(
  {
    name: 'aload',
    description: 'loads all items of the array in the operand stack',
    labels: ['array'],
    signature: {
      input: [{ type: ValueType.array }]
    },
    samples: [
      {
        in: '[ 1 2 3 ] aload pop',
        out: '1 2 3'
      }
    ]
  },
  ({ operands }, arrayValue) => {
    const { array } = arrayValue;
    return operands.popush(1, [...enumIArrayValues(array)], arrayValue);
  }
);
