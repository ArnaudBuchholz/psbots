import { buildFunctionOperator } from '@core/operators/operators.js';

buildFunctionOperator(
  {
    name: 'rangecheck',
    description: 'throws the exception : Operand is too big or too small',
    labels: ['exception'],
    signature: {
      exceptions: ['rangecheck']
    },
    samples: [
      {
        in: 'rangecheck',
        out: 'rangecheck'
      }
    ]
  },
  () => ({ success: false, exception: 'rangeCheck' })
);
