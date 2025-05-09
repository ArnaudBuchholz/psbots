import { assert, toIntegerValue } from '@sdk/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

buildFunctionOperator(
  {
    name: 'countexecstack',
    description: 'returns the number of values in the call stack',
    labels: ['callstack'],
    signature: {
      output: [{ type: 'integer' }]
    },
    samples: [
      {
        in: 'countexecstack',
        out: '3'
      }
    ]
  },
  ({ operands, calls }) => {
    const integerResult = toIntegerValue(calls.length);
    assert(integerResult); // cannot exceed limit
    return operands.push(integerResult.value);
  }
);
