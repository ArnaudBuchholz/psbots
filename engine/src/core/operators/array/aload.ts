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
        in: '[ 1 2 3 ] aload',
        out: '1 2 3'
      }
    ]
  },
  ({ operands }, array: IReadOnlyArray) => {
    operands.pop();
    for (const value of enumIArrayValues(array)) {
      operands.push(value);
    }
  }
);
