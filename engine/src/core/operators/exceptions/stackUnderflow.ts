import { StackUnderflowException } from '@sdk/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

buildFunctionOperator(
  {
    name: 'stackunderflow',
    description: 'throws the exception : Not enough operands on the stack to perform the operation',
    labels: ['exception'],
    signature: {
      exceptions: ['stackunderflow']
    },
    samples: [
      {
        in: 'stackunderflow',
        out: 'stackunderflow'
      }
    ]
  },
  () => ({ success: false, error: new StackUnderflowException() })
);
