import { buildFunctionOperator } from '@core/operators/operators.js';

buildFunctionOperator(
  {
    name: 'stop',
    description: 'throws the exception : Execution stopped',
    labels: ['exception'],
    signature: {
      exceptions: ['stop']
    },
    samples: [
      {
        in: 'stop',
        out: 'stop'
      }
    ]
  },
  () => ({ success: false, exception: 'stop' })
);
