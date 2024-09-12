import { BreakException } from '@sdk/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

buildFunctionOperator(
  {
    name: 'break',
    description: 'throws the exception : Loop break',
    labels: ['exception'],
    signature: {
      input: [],
      output: [],
      exceptions: ['break']
    },
    samples: [
      {
        in: 'break',
        out: 'break'
      }
    ]
  },
  () => {
    throw new BreakException();
  }
);
