import type { IInternalState } from '@sdk/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';
import { closeToMark } from '@core/operators/openClose.js';

buildFunctionOperator(
  {
    name: ']',
    description: 'finalizes an array',
    labels: ['array', 'mark'],
    signature: {
      output: [{ type: 'array', permissions: { isReadOnly: false, isExecutable: false } }]
    },
    samples: [
      {
        description: 'builds an array and check length and type',
        in: '[ 1 2 3 ] dup length exch type',
        out: '3 /array'
      },
      {
        description: 'allocates an empty array',
        in: '[] dup length exch type',
        out: '0 /array'
      },
      {
        description: 'fails if the corresponding array start does not exist',
        in: ' 1 2 3 ]',
        out: '1 2 3 unmatchedmark'
      }
    ]
  },
  (state: IInternalState) => closeToMark(state, { isExecutable: false })
);
