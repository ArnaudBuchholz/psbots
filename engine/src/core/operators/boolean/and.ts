import { ValueType } from '@api/index.js';
import { toBooleanValue } from '@sdk/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

buildFunctionOperator(
  {
    name: 'and',
    description: 'combines two booleans with and',
    labels: ['boolean'],
    signature: {
      input: [{ type: ValueType.boolean }, { type: ValueType.boolean }],
      output: [{ type: ValueType.boolean }]
    },
    samples: [
      {
        in: 'false false and',
        out: 'false'
      },
      {
        in: 'false true and',
        out: 'false'
      },
      {
        in: 'true false and',
        out: 'false'
      },
      {
        in: 'true true and',
        out: 'true'
      }
    ]
  },
  ({ operands }, { isSet: value1 }, { isSet: value2 }) => operands.popush(2, toBooleanValue(value1 && value2))
);
