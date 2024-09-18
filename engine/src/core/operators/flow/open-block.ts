import { buildFunctionOperator } from '@core/operators/operators.js';
import { openWithMark } from '@core/operators/open-close.js';
import type { IInternalState } from '@sdk/interfaces';

buildFunctionOperator(
  {
    name: '{',
    description: 'marks the beginning of a block',
    labels: ['flow', 'mark'],
    signature: {
      input: [],
      output: []
    },
    samples: [
      {
        description: 'builds a block and check length and type',
        in: '{ 1 2 3 } dup length exch type',
        out: '3 "array"'
      }
    ]
  },
  (state: IInternalState) => {
    openWithMark(state);
    state.preventCall();
  }
);
