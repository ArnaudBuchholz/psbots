import { UndefinedResultException } from '@sdk/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

buildFunctionOperator(
  {
    name: 'undefinedresult',
    description: 'throws the exception : Result cannot be represented as a number',
    labels: ['exception'],
    signature: {
      exceptions: ['undefinedresult']
    },
    samples: [
      {
        in: 'undefinedresult',
        out: 'undefinedresult'
      }
    ]
  },
  () => ({ success: false, error: new UndefinedResultException() })
);
