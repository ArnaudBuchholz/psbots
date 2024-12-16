import { IInternalState, UndefinedException } from '@sdk/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

buildFunctionOperator(
  {
    name: 'undefined',
    description: 'throws the exception : Name is not defined in the dictionary stack',
    labels: ['exception'],
    signature: {
      input: [],
      output: [],
      exceptions: ['undefined']
    },
    samples: [
      {
        in: 'undefined',
        out: 'undefined'
      }
    ]
  },
  (state: IInternalState) => {
    state.raiseException(new UndefinedException());
  }
);
