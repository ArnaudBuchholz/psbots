import { IInternalState, StackUnderflowException } from '@sdk/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

buildFunctionOperator(
  {
    name: 'stackunderflow',
    description: 'throws the exception : Not enough operands on the stack to perform the operation',
    labels: ['exception'],
    signature: {
      input: [],
      output: [],
      exceptions: ['stackunderflow']
    },
    samples: [
      {
        in: 'stackunderflow',
        out: 'stackunderflow'
      }
    ]
  },
  (state: IInternalState) => {
    state.raiseException(new StackUnderflowException());
  }
);
