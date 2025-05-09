import { trueValue, falseValue } from '@api/index.js';
import { valuesOf } from '@sdk/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

buildFunctionOperator(
  {
    name: 'neq',
    description: 'returns true if the two values are strictly different',
    labels: ['generic', 'comparison'],
    signature: {
      input: [{ type: 'null' }, { type: 'null' }],
      output: [{ type: 'boolean' }]
    },
    samples: [
      {
        in: '1 1 neq',
        out: 'false'
      },
      {
        in: '1 2 neq',
        out: 'true'
      },
      {
        in: '1 "1" neq',
        out: 'true'
      },
      {
        in: '[ ] [ ] neq',
        out: 'true'
      },
      {
        in: '[ ] dup neq',
        out: 'false'
      }
    ]
  },
  ({ operands }, value1, value2) => {
    let eq: boolean;
    if (value1.type === value2.type) {
      const [raw1, raw2] = valuesOf(value1, value2);
      eq = raw1 !== raw2;
    } else {
      eq = true;
    }
    return operands.popush(2, eq ? trueValue : falseValue);
  }
);
