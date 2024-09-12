import { ValueType } from '@api/index.js';
import type { Value } from '@api/index.js';
import { toBooleanValue, valuesOf } from '@sdk/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

buildFunctionOperator(
  {
    name: 'eq',
    description: 'compares two values and return true if they are strictly equal',
    labels: ['generic', 'comparison'],
    signature: {
      input: [null, null],
      output: [ValueType.boolean]
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
  ({ operands }, value1: Value, value2: Value) => {
    operands.pop();
    operands.pop();
    if (value1.type !== value2.type) {
      operands.push(toBooleanValue(false));
    } else {
      const [raw1, raw2] = valuesOf(value1, value2);
      operands.push(toBooleanValue(raw1 === raw2));
    }
  }
);
