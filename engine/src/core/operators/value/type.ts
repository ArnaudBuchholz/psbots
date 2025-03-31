import { ValueType } from '@api/index.js';
import { assert, toNameValue } from '@sdk/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';
import { MemoryTracker } from '@core/MemoryTracker.js';

buildFunctionOperator(
  {
    name: 'type',
    description: 'pushes the type of the value in the operand stack',
    labels: ['value', 'generic'],
    signature: {
      input: [{ type: ValueType.null }],
      output: [{ type: ValueType.name }]
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
  ({ operands, memoryTracker }, value) => {
    assert(memoryTracker instanceof MemoryTracker);
    const { type } = value;
    const referenced = memoryTracker.addStringRef(type);
    if (!referenced.success) {
      return referenced;
    }
    const popushResult = operands.popush(1, toNameValue(type, { tracker: memoryTracker }));
    memoryTracker.releaseString(type);
    return popushResult;
  }
);
