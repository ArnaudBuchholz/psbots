import { ValueType } from '@api/index.js';
import { toBooleanValue } from '@sdk/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

buildFunctionOperator(
  {
    name: 'gte',
    description: 'compares two integers to see if greater than or equal',
    labels: ['integer', 'math', 'comparison'],
    signature: {
      input: [ValueType.integer, ValueType.integer],
      output: [ValueType.boolean]
    },
    samples: [
      {
        in: '1 2 gte',
        out: 'false'
      },
      {
        in: '2 1 gte',
        out: 'true'
      },
      {
        in: '1 1 gte',
        out: 'true'
      }
    ]
  },
  ({ operands }, value1: number, value2: number) => {
    operands.pop();
    operands.pop();
    operands.push(toBooleanValue(value1 >= value2));
  }
);
