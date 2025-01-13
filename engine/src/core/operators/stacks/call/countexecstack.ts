import { ValueType } from '@api/index.js';
import { assert, toIntegerValue } from '@sdk/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

buildFunctionOperator(
  {
    name: 'countexecstack',
    description: 'retrieves the number of dictionaries in the dictionary stack',
    labels: ['callstack'],
    signature: {
      output: [{ type: ValueType.integer }]
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
