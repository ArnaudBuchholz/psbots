import { BusyException } from '@sdk/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

buildFunctionOperator(
  {
    name: 'busy',
    description: 'throws the exception : Engine is already busy',
    labels: ['exception'],
    signature: {
      exceptions: ['busy']
    },
    samples: [
      {
        in: 'busy',
        out: 'busy'
      }
    ]
  },
  () => ({ success: false, error: new BusyException() })
);
