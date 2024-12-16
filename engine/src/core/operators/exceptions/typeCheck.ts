import { TypeCheckException } from '@sdk/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

buildFunctionOperator(
  {
    name: 'typecheck',
    description: 'throws the exception : Operand is of the wrong type',
    labels: ['exception'],
    signature: {
      input: [],
      output: [],
      exceptions: ['typecheck']
    },
    samples: [
      {
        in: 'typecheck',
        out: 'typecheck'
      }
    ]
  },
  (state) => {
    state.raiseException(new TypeCheckException());
  }
);
