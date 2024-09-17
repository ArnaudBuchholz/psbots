import { ValueType } from '@api/index.js';
import { toIntegerValue } from '@sdk/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

buildFunctionOperator(
  {
    name: 'countexecstack',
    description: 'retrieves the number of dictionaries in the dictionary stack',
    labels: ['callstack'],
    signature: {
      input: [],
      output: [ValueType.integer]
    },
    samples: [
      {
        in: 'countexecstack',
        out: '3'
      }
    ]
  },
  ({ operands, calls }) => operands.push(toIntegerValue(calls.length))
);
