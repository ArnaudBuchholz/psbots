import { ValueType } from '@api/index.js';
import type { Value } from '@api/index.js';
import { assert, toNameValue } from '@sdk/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';
import { MemoryTracker } from '@core/MemoryTracker.js';

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
  (state, value: Value) => {
    const { operands, memoryTracker } = state;
    assert(memoryTracker instanceof MemoryTracker);
    const { type } = value;
    const refResult = memoryTracker.addStringRef(type);
    if (!refResult.success) {
      state.raiseException(refResult);
      return;
    }
    const popushResult = operands.popush(1, toNameValue(type, { tracker: memoryTracker }));
    memoryTracker.releaseString(type);
    if (!popushResult.success) {
      state.raiseException(popushResult);
    }
  }
);
