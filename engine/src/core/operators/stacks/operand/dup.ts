import type { Value } from '@api/index.js';
import { ValueType } from '@api/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

buildFunctionOperator(
  {
    name: 'dup',
    description: 'duplicates the top item of the operand stack',
    labels: ['operand'],
    signature: {
      input: [{ type: ValueType.null }],
      output: [{ type: ValueType.null }, { type: ValueType.null }]
    },
    samples: [
      {
        in: '1 2 3 dup',
        out: '1 2 3 3'
      }
    ]
  },
  ({ operands }, value: Value) => operands.push(value)
);
