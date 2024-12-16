import { IInternalState, VmOverflowException } from '@sdk/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

buildFunctionOperator(
  {
    name: 'vmoverflow',
    description: 'throws the exception : Virtual memory exceeded',
    labels: ['exception'],
    signature: {
      input: [],
      output: [],
      exceptions: ['vmoverflow']
    },
    samples: [
      {
        in: 'vmoverflow',
        out: 'vmoverflow'
      }
    ]
  },
  (state: IInternalState) => {
    state.raiseException(new VmOverflowException());
  }
);
