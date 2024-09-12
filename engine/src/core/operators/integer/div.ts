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
  ({ operands }, value1: number, value2: number) => {
    operands.pop();
    operands.pop();
    // TODO: divide by 0
    const reminder = value1 % value2;
    operands.push(toIntegerValue((value1 - reminder) / value2));
    operands.push(toIntegerValue(reminder));
  }
);
