import { ValueType } from '@api/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

buildFunctionOperator(
  {
    name: 'exch',
    description: 'swaps the first two items of the operand stack',
    labels: ['operand'],
    signature: {
      input: [{ type: ValueType.null }, { type: ValueType.null }],
      output: [{ type: ValueType.null }, { type: ValueType.null }]
    },
    samples: [
      {
        in: '1 2 3 exch',
        out: '1 3 2'
      }
    ]
  },
  ({ operands }, value1, value2) => operands.popush(2, value2, value1)
);
