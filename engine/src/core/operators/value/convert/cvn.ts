import { ValueType } from '@api/index.js';
import { assert, toNameValue } from '@sdk/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';
import { MemoryTracker } from '@core/MemoryTracker.js';

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
  (state, string: string) => {
    const { operands, memoryTracker } = state;
    assert(memoryTracker instanceof MemoryTracker);
    const refResult = memoryTracker.addStringRef(string);
    if (!refResult.success) {
      state.raiseException(refResult);
      return;
    }
    const popushResult = operands.popush(1, toNameValue(string, { tracker: memoryTracker }));
    memoryTracker.releaseString(string);
    if (!popushResult.success) {
      state.raiseException(popushResult);
    }
  }
);
