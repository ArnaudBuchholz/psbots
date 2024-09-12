import { BusyException } from '@sdk/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

buildFunctionOperator(
  {
    name: 'busy',
    description: 'throws the exception : Engine is already busy',
    labels: ['exception'],
    signature: {
      input: [],
      output: [],
      exceptions: ['busy']
    },
    samples: [
      {
        in: 'busy',
        out: 'busy'
      }
    ]
  },
  () => {
    throw new BusyException();
  }
);
