import { ValueType } from '@api/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

buildFunctionOperator(
  {
    name: 'index',
    description: 'duplicates the Nth item of the operand stack',
    labels: ['operand'],
    signature: {
      input: [{ type: ValueType.integer }],
      output: [{ type: ValueType.null }]
    },
    samples: [
      {
        in: '1 2 3 1 index',
        out: '1 2 3 2'
      },
      {
        description: 'throws stackunderflow if index is too big',
        in: '1 2 3 5 index',
        out: '1 2 3 5 stackunderflow'
      }
    ]
  },
  ({ operands }, { integer: offset }) => {
    if (offset > operands.length) {
      return { success: false, exception: 'stackUnderflow' };
    }
    return operands.popush(1, operands.at(offset + 1));
  }
);
