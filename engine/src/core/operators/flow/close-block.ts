import { ValueType } from '@api/index.js';
import type { IInternalState } from '@sdk/index.js';
import { OPERATOR_STATE_FIRST_CALL } from '@sdk/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';
import { closeToMark } from '@core/operators/open-close.js';

buildFunctionOperator(
  {
    name: '}',
    description: 'finalizes a block',
    labels: ['flow', 'mark'],
    signature: {
      output: [{ type: ValueType.array, permissions: { isExecutable: true, isReadOnly: true } }]
    },
    samples: [
      {
        description: 'builds a block and check length and type',
        in: '{ 1 2 3 } dup length exch type',
        out: '3 /array'
      },
      {
        description: 'allocated an empty block',
        in: '{} dup length exch type',
        out: '0 /array'
      },
      {
        description: 'fails if the corresponding block start does not exist',
        in: '1 2 3 }',
        out: '1 2 3 unmatchedmark'
      }
    ]
  },
  (state: IInternalState) => {
    if (state.calls.topOperatorState === OPERATOR_STATE_FIRST_CALL) {
      state.allowCall();
    }
    return closeToMark(state, { isExecutable: true });
  }
);
