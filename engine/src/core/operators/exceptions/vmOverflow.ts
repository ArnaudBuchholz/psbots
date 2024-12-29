import { VmOverflowException } from '@sdk/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

buildFunctionOperator(
  {
    name: 'vmoverflow',
    description: 'throws the exception : Virtual memory exceeded',
    labels: ['exception'],
    signature: {
      exceptions: ['vmoverflow']
    },
    samples: [
      {
        in: 'vmoverflow',
        out: 'vmoverflow'
      }
    ]
  },
  () => ({ success: false, error: new VmOverflowException() })
);
