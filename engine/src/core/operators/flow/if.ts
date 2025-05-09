import { buildFunctionOperator } from '@core/operators/operators.js';

buildFunctionOperator(
  {
    name: 'if',
    description: 'executes the top operand based on the next boolean',
    labels: ['flow'],
    signature: {
      input: [{ type: 'boolean' }, { type: 'null' }]
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
  ({ operands, calls }, { isSet: condition }, value) => {
    operands.popush(2);
    if (condition) {
      return calls.push(value);
    }
    return { success: true, value: undefined };
  }
);
