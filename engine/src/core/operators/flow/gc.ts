import { assert, OPERATOR_STATE_FIRST_CALL, OPERATOR_STATE_POP } from '@sdk/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';
import { MemoryTracker } from '@core/MemoryTracker.js';

buildFunctionOperator(
  {
    name: 'gc',
    description: 'triggers garbage collection',
    labels: ['flow'],
    samples: [
      {
        in: 'mark gc',
        out: 'mark'
      }
    ]
  },
  ({ memoryTracker, calls }) => {
    assert(memoryTracker instanceof MemoryTracker);
    if (calls.topOperatorState === OPERATOR_STATE_FIRST_CALL) {
      calls.topOperatorState = 1;
    } else {
      ++calls.topOperatorState;
    }
    if (!memoryTracker.collectGarbage()) {
      calls.topOperatorState = OPERATOR_STATE_POP;
    }
  }
);
