import { trueValue, falseValue } from '@api/index.js';
import { valuesOf } from '@sdk/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

buildFunctionOperator(
  {
    name: 'eq',
    description: 'returns true if the two values are strictly equal',
    labels: ['generic', 'comparison'],
    signature: {
      input: [{ type: 'null' }, { type: 'null' }],
      output: [{ type: 'boolean' }]
    },
    samples: [
      {
        in: '1 1 eq',
        out: 'true'
      },
      {
        in: '1 2 eq',
        out: 'false'
      },
      {
        in: '1 "1" eq',
        out: 'false'
      },
      {
        in: '[ ] [ ] eq',
        out: 'false'
      },
      {
        in: '[ ] dup eq',
        out: 'true'
      }
    ]
  },
  ({ operands }, value1, value2) => {
    let eq: boolean;
    if (value1.type === value2.type) {
      const [raw1, raw2] = valuesOf(value1, value2);
      eq = raw1 === raw2;
    } else {
      eq = false;
    }
    return operands.popush(2, eq ? trueValue : falseValue);
  }
);
