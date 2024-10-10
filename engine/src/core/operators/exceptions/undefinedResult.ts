import { UndefinedResultException } from '@sdk/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

buildFunctionOperator(
  {
    name: 'undefinedresult',
    description: 'throws the exception : Result cannot be represented as a number',
    labels: ['exception'],
    signature: {
      input: [],
      output: [],
      exceptions: ['undefinedresult']
    },
    samples: [
      {
        in: 'undefinedresult',
        out: 'undefinedresult'
      }
    ]
  },
  () => {
    throw new UndefinedResultException();
  }
);
