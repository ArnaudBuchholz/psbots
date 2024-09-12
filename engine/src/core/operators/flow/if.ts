import { ValueType } from '@api/index.js';
import type { Value } from '@api/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

buildFunctionOperator(
  {
    name: 'if',
    description: 'executes the operand based on a condition',
    labels: ['flow'],
    signature: {
      input: [ValueType.boolean, null],
      output: []
    },
    samples: [
      {
        in: 'mark true { 123 } if',
        out: 'mark 123'
      },
      {
        in: 'mark false { 123 } if',
        out: 'mark'
      },
      {
        description: 'supports operand that is not a block',
        in: 'mark true 123 if',
        out: 'mark 123'
      }
    ]
  },
  ({ operands, calls }, condition: boolean, value: Value) => {
    operands.pop();
    operands.pop();
    if (condition) {
      calls.push(value);
    }
  }
);
