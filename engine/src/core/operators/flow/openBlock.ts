import type { IInternalState } from '@sdk/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';
import { openWithMark } from '@core/operators/openClose.js';

buildFunctionOperator(
  {
    name: '{',
    description: 'marks the beginning of a block',
    labels: ['flow', 'mark'],
    samples: [
      {
        description: 'builds a block and check length and type',
        in: '{ 1 2 3 } dup length exch type',
        out: '3 /array'
      }
    ]
  },
  (state: IInternalState) => {
    const result = openWithMark(state);
    if (result.success) {
      state.preventCall();
    }
    return result;
  }
);
