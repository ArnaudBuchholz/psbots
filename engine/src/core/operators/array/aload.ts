import { enumIArrayValues, ValueType } from '@api/index.js';
import type { IReadOnlyArray } from '@api/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

buildFunctionOperator(
  {
    name: 'aload',
    description: 'loads all items of the array in the operand stack',
    labels: ['array'],
    signature: {
      input: [ValueType.array],
      output: []
    },
    samples: [
      {
        in: '[ 1 2 3 ] aload pop',
        out: '1 2 3'
      }
    ]
  },
  ({ operands }, array: IReadOnlyArray) => {
    const arrayValue = operands.top;
    for (const value of enumIArrayValues(array)) {
      operands.push(value);
    }
    operands.push(arrayValue);
  }
);
