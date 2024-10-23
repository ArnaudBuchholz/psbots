import { ValueType } from '@api/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

buildFunctionOperator(
  {
    name: 'globaldict',
    description: 'retrieves the global dictionary from the dictionary stack',
    labels: ['dictstack'],
    signature: {
      input: [],
      output: [ValueType.dictionary]
    },
    samples: [
      {
        in: 'globaldict type',
        out: '/dictionary'
      }
    ]
  },
  ({ operands, dictionaries }) => operands.push(dictionaries.global)
);
