import { InvalidBreakException } from '@sdk/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

buildFunctionOperator(
  {
    name: 'invalidbreak',
    description: 'throws the exception : break has been invoked outside of a loop',
    labels: ['exception'],
    signature: {
      input: [],
      output: [],
      exceptions: ['invalidbreak']
    },
    samples: [
      {
        in: 'invalidbreak',
        out: 'invalidbreak'
      }
    ]
  },
  () => {
    throw new InvalidBreakException();
  }
);
