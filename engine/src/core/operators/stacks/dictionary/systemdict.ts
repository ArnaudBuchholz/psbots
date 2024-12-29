import { ValueType } from '@api/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

buildFunctionOperator(
  {
    name: 'systemdict',
    description: 'retrieves the system dictionary from the dictionary stack',
    labels: ['dictstack'],
    signature: {
      output: [{ type: ValueType.dictionary }]
    },
    samples: [
      {
        in: 'systemdict type',
        out: '/dictionary'
      }
    ]
  },
  ({ operands, dictionaries }) => operands.push(dictionaries.system)
);
