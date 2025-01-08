import { buildFunctionOperator } from '@core/operators/operators.js';

buildFunctionOperator(
  {
    name: 'typecheck',
    description: 'throws the exception : Operand is of the wrong type',
    labels: ['exception'],
    signature: {
      exceptions: ['typecheck']
    },
    samples: [
      {
        in: 'typecheck',
        out: 'typecheck'
      }
    ]
  },
  () => ({ success: false, exception: 'typeCheck' })
);
