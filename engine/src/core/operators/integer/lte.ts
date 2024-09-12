import { ValueType } from '@api/index.js';
import { toBooleanValue } from '@sdk/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

buildFunctionOperator(
  {
    name: 'lte',
    description: 'compares two integers to see if lower than or equal',
    labels: ['integer', 'math', 'comparison'],
    signature: {
      input: [ValueType.integer, ValueType.integer],
      output: [ValueType.boolean]
    },
    samples: [
      {
        in: '1 2 lte',
        out: 'true'
      },
      {
        in: '2 1 lte',
        out: 'false'
      },
      {
        in: '1 1 lte',
        out: 'true'
      }
    ]
  },
  ({ operands }, value1: number, value2: number) => {
    operands.pop();
    operands.pop();
    operands.push(toBooleanValue(value1 <= value2));
  }
);
