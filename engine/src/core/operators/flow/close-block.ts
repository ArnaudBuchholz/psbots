import type { IInternalState } from '@sdk/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';
import { closeToMark } from '@core/operators/open-close.js';

buildFunctionOperator(
  {
    name: '}',
    description: 'finalizes a block',
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
  (state: IInternalState) => closeToMark(state, { isExecutable: true })
);
