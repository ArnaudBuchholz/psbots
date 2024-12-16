import { IInternalState, DictStackUnderflowException } from '@sdk/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

buildFunctionOperator(
  {
    name: 'dictstackunderflow',
    description: 'throws the exception : No custom dictionary left to unstack',
    labels: ['exception'],
    signature: {
      input: [],
      output: [],
      exceptions: ['dictstackunderflow']
    },
    samples: [
      {
        in: 'dictstackunderflow',
        out: 'dictstackunderflow'
      }
    ]
  },
  (state: IInternalState) => {
    state.raiseException(new DictStackUnderflowException());
  }
);
