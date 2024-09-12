import { InvalidAccessException } from '@sdk/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

buildFunctionOperator(
  {
    name: 'invalidaccess',
    description: 'throws the exception : Object is read-only',
    labels: ['exception'],
    signature: {
      input: [],
      output: [],
      exceptions: ['invalidaccess']
    },
    samples: [
      {
        in: 'invalidaccess',
        out: 'invalidaccess'
      }
    ]
  },
  () => {
    throw new InvalidAccessException();
  }
);
