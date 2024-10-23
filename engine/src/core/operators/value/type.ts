import { ValueType } from '@api/index.js';
import type { Value } from '@api/index.js';
import { toNameValue } from '@sdk/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

buildFunctionOperator(
  {
    name: 'type',
    description: 'pushes the type of the value in the operand stack',
    labels: ['value', 'generic'],
    signature: {
      input: [null],
      output: [ValueType.name]
    },
    samples: [
      {
        in: 'false type',
        out: '/boolean'
      },
      {
        in: '[ 1 2 3 ] type',
        out: '/array'
      },
      {
        in: '"" type',
        out: '/string'
      },
      {
        in: '/type type',
        out: '/name'
      }
    ]
  },
  ({ operands, memoryTracker }, value: Value) => {
    operands.pop();
    operands.push(Object.assign(toNameValue(value.type), { tracker: memoryTracker }));
  }
);
