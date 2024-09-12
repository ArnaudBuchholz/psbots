import { ValueType } from '@api/index.js';
import type { Value } from '@api/index.js';
import { toStringValue } from '@sdk/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

buildFunctionOperator(
  {
    name: 'type',
    description: 'pushes the type of the value in the operand stack',
    labels: ['value', 'generic'],
    signature: {
      input: [null],
      output: [ValueType.string]
    },
    samples: [
      {
        in: 'false type',
        out: '"boolean"'
      },
      {
        in: '[ 1 2 3 ] type',
        out: '"array"'
      },
      {
        in: '"" type',
        out: '"string"'
      }
    ]
  },
  ({ operands, memoryTracker }, value: Value) => {
    operands.pop();
    operands.push(Object.assign(toStringValue(value.type), { tracker: memoryTracker }));
  }
);
