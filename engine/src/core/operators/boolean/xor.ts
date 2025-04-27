import { falseValue, trueValue, ValueType } from '@api/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

buildFunctionOperator(
  {
    name: 'xor',
    description: 'combines two booleans with exclusive or',
    labels: ['boolean'],
    signature: {
      input: [{ type: ValueType.boolean }, { type: ValueType.boolean }],
      output: [{ type: ValueType.boolean }]
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
  ({ operands }, { isSet: value1 }, { isSet: value2 }) =>
    operands.popush(2, (value1 && !value2) || (!value1 && value2) ? trueValue : falseValue)
);
