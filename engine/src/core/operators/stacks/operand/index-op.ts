import { ValueType } from '@api/index.js';
import { StackUnderflowException } from '@sdk/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

buildFunctionOperator(
  {
    name: 'index',
    description: 'duplicates the Nth item of the operand stack',
    labels: ['operand'],
    signature: {
      input: [ValueType.integer],
      output: [null]
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
  ({ operands }, offset: number) => {
    if (offset > operands.length) {
      throw new StackUnderflowException();
    }
    operands.pop();
    const value = operands.at(offset)!;
    operands.push(value);
  }
);
