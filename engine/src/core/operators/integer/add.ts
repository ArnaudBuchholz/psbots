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
  ({ operands }, value1: number, value2: number) => {
    operands.pop();
    operands.pop();
    operands.push(toIntegerValue(value1 + value2));
  }
);
