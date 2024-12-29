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
      input: [{ type: ValueType.string }],
      output: [{ type: ValueType.name }]
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
  ({ operands, memoryTracker }, { string }) => {
    assert(memoryTracker instanceof MemoryTracker);
    const refResult = memoryTracker.addStringRef(string); // might be untracked
    if (!refResult.success) {
      return refResult;
    }
    const popushResult = operands.popush(1, toNameValue(string, { tracker: memoryTracker }));
    memoryTracker.releaseString(string);
    return popushResult;
  }
);
