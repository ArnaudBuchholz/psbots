import { assert, toNameValue } from '@sdk/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';
import { MemoryTracker } from '@core/MemoryTracker.js';

buildFunctionOperator(
  {
    name: 'cvn',
    description: 'converts to name',
    labels: ['value', 'generic', 'conversion'],
    signature: {
      input: [{ type: 'string' }],
      output: [{ type: 'name' }]
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
    const referenced = memoryTracker.addStringRef(string); // might be untracked
    if (!referenced.success) {
      return referenced;
    }
    const popushResult = operands.popush(1, toNameValue(string, { tracker: memoryTracker }));
    memoryTracker.releaseString(string);
    return popushResult;
  }
);
