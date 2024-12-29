import { ValueType } from '@api/index.js';
import { toBooleanValue, valuesOf } from '@sdk/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

buildFunctionOperator(
  {
    name: 'neq',
    description: 'compares two values and return true if they are strictly different',
    labels: ['generic', 'comparison'],
    signature: {
      input: [{ type: ValueType.null }, { type: ValueType.null }],
      output: [{ type: ValueType.boolean }]
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
    if (value1.type !== value2.type) {
      eq = true;
    } else {
      const [raw1, raw2] = valuesOf(value1, value2);
      eq = raw1 !== raw2;
    }
    return operands.popush(2, toBooleanValue(eq));
  }
);
