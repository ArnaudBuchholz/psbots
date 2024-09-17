import { ValueType } from '@api/index.js';
import { toBooleanValue } from '@sdk/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

buildFunctionOperator(
  {
    name: 'or',
    description: 'combines two booleans with or',
    labels: ['boolean'],
    signature: {
      input: [ValueType.boolean, ValueType.boolean],
      output: [ValueType.boolean]
    },
    samples: [
      {
        in: 'false false or',
        out: 'false'
      },
      {
        in: 'false true or',
        out: 'true'
      },
      {
        in: 'true false or',
        out: 'true'
      },
      {
        in: 'true true or',
        out: 'true'
      }
    ]
  },
  ({ operands }, value1: boolean, value2: boolean) => {
    operands.pop();
    operands.pop();
    operands.push(toBooleanValue(value1 || value2));
  }
);
