import { buildFunctionOperator } from '@core/operators/operators.js';

buildFunctionOperator(
  {
    name: 'limitcheck',
    description: 'throws the exception : An implementation limit has been exceeded',
    labels: ['exception'],
    signature: {
      exceptions: ['limitcheck']
    },
    samples: [
      {
        in: 'limitcheck',
        out: 'limitcheck'
      }
    ]
  },
  () => ({ success: false, exception: 'limitcheck' })
);
