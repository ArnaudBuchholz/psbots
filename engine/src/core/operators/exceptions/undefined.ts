import { buildFunctionOperator } from '@core/operators/operators.js';

buildFunctionOperator(
  {
    name: 'undefined',
    description: 'throws the exception : Name is not defined in the dictionary stack',
    labels: ['exception'],
    signature: {
      exceptions: ['undefined']
    },
    samples: [
      {
        in: 'undefined',
        out: 'undefined'
      }
    ]
  },
  () => ({ success: false, exception: 'undefined' })
);
