import { ValueType } from '@api/index.js';
import { toBooleanValue } from '@sdk/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

buildFunctionOperator(
  {
    name: 'xor',
    description: 'combines two booleans with exclusive or',
    labels: ['boolean'],
    signature: {
      input: [ValueType.boolean, ValueType.boolean],
      output: [ValueType.boolean]
    },
    samples: [
      {
        in: 'false false xor',
        out: 'false'
      },
      {
        in: 'false true xor',
        out: 'true'
      },
      {
        in: 'true false xor',
        out: 'true'
      },
      {
        in: 'true true xor',
        out: 'false'
      }
    ]
  },
  ({ operands }, value1: boolean, value2: boolean) => operands.popush(2, toBooleanValue((value1 && !value2) || (!value1 && value2)))
);
