import { ValueType } from '@api/index.js';
import type { Value } from '@api/index.js';
import { toBooleanValue, valuesOf } from '@sdk/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

buildFunctionOperator(
  {
    name: 'neq',
    description: 'compares two values and return true if they are strictly different',
    labels: ['generic', 'comparison'],
    signature: {
      input: [null, null],
      output: [ValueType.boolean]
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
  ({ operands }, value1: Value, value2: Value) => {
    operands.pop();
    operands.pop();
    if (value1.type !== value2.type) {
      operands.push(toBooleanValue(true));
    } else {
      const [raw1, raw2] = valuesOf(value1, value2);
      operands.push(toBooleanValue(raw1 !== raw2));
    }
  }
);
