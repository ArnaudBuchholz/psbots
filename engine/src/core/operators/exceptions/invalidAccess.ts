import { buildFunctionOperator } from '@core/operators/operators.js';

buildFunctionOperator(
  {
    name: 'invalidaccess',
    description: 'throws the exception : Object is read-only',
    labels: ['exception'],
    signature: {
      exceptions: ['invalidaccess']
    },
    samples: [
      {
        in: 'invalidaccess',
        out: 'invalidaccess'
      }
    ]
  },
  () => ({ success: false, exception: 'invalidAccess' })
);
