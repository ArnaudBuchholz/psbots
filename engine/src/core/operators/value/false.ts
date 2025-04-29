import { falseValue } from '@api/index.js';
import { buildConstantOperator } from '@core/operators/operators.js';

buildConstantOperator(
  {
    name: 'false',
    description: 'pushes false onto the stack',
    labels: ['boolean', 'value'],
    signature: {
      output: [{ type: 'boolean' }]
    },
    samples: [
      {
        in: 'false',
        out: 'false'
      }
    ]
  },
  falseValue
);
