import { falseValue, trueValue } from '@api/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

buildFunctionOperator(
  {
    name: 'or',
    description: 'combines two booleans with or',
    labels: ['boolean'],
    signature: {
      input: [{ type: 'boolean' }, { type: 'boolean' }],
      output: [{ type: 'boolean' }]
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
  ({ operands }, { isSet: value1 }, { isSet: value2 }) => operands.popush(2, value1 || value2 ? trueValue : falseValue)
);
