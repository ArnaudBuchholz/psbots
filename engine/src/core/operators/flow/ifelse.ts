import { ValueType } from '@api/index.js';
import type { Value } from '@api/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

buildFunctionOperator(
  {
    name: 'ifelse',
    description: 'executes the operands based on a condition',
    labels: ['flow'],
    signature: {
      input: [ValueType.boolean, null, null],
      output: []
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
  ({ operands, calls }, condition: boolean, ifValue: Value, elseValue: Value) => {
    operands.pop();
    operands.pop();
    operands.pop();
    if (condition) {
      calls.push(ifValue);
    } else {
      calls.push(elseValue);
    }
  }
);
