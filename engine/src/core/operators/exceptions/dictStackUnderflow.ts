import { buildFunctionOperator } from '@core/operators/operators.js';

buildFunctionOperator(
  {
    name: 'dictstackunderflow',
    description: 'throws the exception : No custom dictionary left to unstack',
    labels: ['exception'],
    signature: {
      exceptions: ['dictstackunderflow']
    },
    samples: [
      {
        in: 'dictstackunderflow',
        out: 'dictstackunderflow'
      }
    ]
  },
  () => ({ success: false, exception: 'dictStackUnderflow' })
);
