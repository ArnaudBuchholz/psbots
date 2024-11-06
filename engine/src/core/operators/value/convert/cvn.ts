import { ValueType } from '@api/index.js';
import { toNameValue } from '@sdk/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

buildFunctionOperator(
  {
    name: 'cvn',
    description: 'converts to name',
    labels: ['value', 'generic', 'conversion'],
    signature: {
      input: [ValueType.string],
      output: [ValueType.name]
    },
    samples: [
      {
        in: '"test" cvn',
        out: '/test'
      },
      {
        in: '/test cvn',
        out: 'typecheck'
      },
      {
        in: '1 cvn',
        out: 'typecheck'
      }
    ]
  },
  ({ operands }, string: string) => {
    const { tracker } = operands.top;
    operands.pop();
    operands.push(toNameValue(string, { tracker }));
  }
);
