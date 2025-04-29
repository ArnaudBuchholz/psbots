import { buildFunctionOperator } from '@core/operators/operators.js';

buildFunctionOperator(
  {
    name: 'userdict',
    description: 'retrieves the user dictionary from the dictionary stack',
    labels: ['dictstack'],
    signature: {
      output: [{ type: 'dictionary' }]
    },
    samples: [
      {
        in: 'userdict type',
        out: '/dictionary'
      }
    ]
  },
  ({ operands, dictionaries }) => operands.push(dictionaries.user)
);
