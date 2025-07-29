import { assert, toIntegerValue } from '@sdk/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

buildFunctionOperator(
  {
    name: 'countdictstack',
    description: 'returns the number of dictionaries in the dictionary stack',
    labels: ['dictstack'],
    signature: {
      output: [{ type: 'integer' }]
    },
    samples: [
      {
        in: 'countdictstack',
        out: '4'
      }
    ]
  },
  ({ operands, dictionaries }) => {
    const integerResult = toIntegerValue(dictionaries.length);
    assert(integerResult); // cannot exceed limit
    return operands.push(integerResult.value);
  }
);
