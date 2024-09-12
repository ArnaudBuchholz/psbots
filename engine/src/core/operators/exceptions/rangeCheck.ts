import { RangeCheckException } from '@sdk/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

buildFunctionOperator(
  {
    name: 'rangecheck',
    description: 'throws the exception : Operand is too big or too small',
    labels: ['exception'],
    signature: {
      input: [],
      output: [],
      exceptions: ['rangecheck']
    },
    samples: [
      {
        in: 'rangecheck',
        out: 'rangecheck'
      }
    ]
  },
  () => {
    throw new RangeCheckException();
  }
);
