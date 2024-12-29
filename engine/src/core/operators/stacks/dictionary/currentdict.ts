import { ValueType } from '@api/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

buildFunctionOperator(
  {
    name: 'currentdict',
    description: 'retrieves the top of the dictionary stack',
    labels: ['dictstack'],
    signature: {
      output: [{ type: ValueType.dictionary }]
    },
    samples: [
      {
        in: 'currentdict type',
        out: '/dictionary'
      }
    ]
  },
  ({ operands, dictionaries }) => operands.push(dictionaries.top)
);
