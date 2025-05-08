import { buildFunctionOperator } from '@core/operators/operators.js';

buildFunctionOperator(
  {
    name: 'hostdict',
    description: 'retrieves the host dictionary from the dictionary stack',
    labels: ['dictstack'],
    signature: {
      output: [{ type: 'dictionary' }]
    },
    samples: [
      {
        in: 'hostdict type',
        out: '/dictionary'
      }
    ]
  },
  ({ operands, dictionaries }) => operands.push(dictionaries.host)
);
