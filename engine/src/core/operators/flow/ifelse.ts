import { buildFunctionOperator } from '@core/operators/operators.js';

buildFunctionOperator(
  {
    name: 'ifelse',
    description: 'executes the operands based on a condition',
    labels: ['flow'],
    signature: {
      input: [{ type: 'boolean' }, { type: 'null' }, { type: 'null' }]
    },
    samples: [
      {
        in: 'mark true { 123 } { 456 } ifelse',
        out: 'mark 123'
      },
      {
        in: 'mark false { 123 } { 456 } ifelse',
        out: 'mark 456'
      },
      {
        description: 'supports operands that are not blocks',
        in: 'mark true 123 456 ifelse',
        out: 'mark 123'
      }
    ]
  },
  ({ operands, calls }, { isSet: condition }, ifValue, elseValue) => {
    operands.popush(3);
    if (condition) {
      return calls.push(ifValue);
    }
    return calls.push(elseValue);
  }
);
