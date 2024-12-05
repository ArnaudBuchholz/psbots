import { LimitcheckException } from '@sdk/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

buildFunctionOperator(
  {
    name: 'limitcheck',
    description: 'throws the exception : An implementation limit has been exceeded',
    labels: ['exception'],
    signature: {
      input: [],
      output: [],
      exceptions: ['limitcheck']
    },
    samples: [
      {
        in: 'limitcheck',
        out: 'limitcheck'
      }
    ]
  },
  () => {
    throw new LimitcheckException();
  }
);
