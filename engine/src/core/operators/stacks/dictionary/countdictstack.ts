import { ValueType } from '@api/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';
import { toIntegerValue } from '@sdk/toValue';

buildFunctionOperator(
  {
    name: 'countdictstack',
    description: 'retrieves the number of dictionaries in the dictionary stack',
    labels: ['dictstack'],
    signature: {
      input: [],
      output: [ValueType.integer]
    },
    samples: [
      {
        in: 'countdictstack',
        out: '4'
      }
    ]
  },
  ({ operands, dictionaries }) => operands.push(toIntegerValue(dictionaries.length))
);
