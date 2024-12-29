import { ValueType } from '@api/index.js';
import { toBooleanValue, valuesOf } from '@sdk/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

buildFunctionOperator(
  {
    name: 'eq',
    description: 'compares two values and return true if they are strictly equal',
    labels: ['generic', 'comparison'],
    signature: {
      input: [{ type: ValueType.null }, { type: ValueType.null }],
      output: [{ type: ValueType.boolean }]
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
    if (value1.type !== value2.type) {
      eq = false;
    } else {
      const [raw1, raw2] = valuesOf(value1, value2);
      eq = raw1 === raw2;
    }
    return operands.popush(2, toBooleanValue(eq));
  }
);
