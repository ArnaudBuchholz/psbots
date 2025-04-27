import { ValueType, trueValue } from '@api/index.js';
import { buildConstantOperator } from '@core/operators/operators.js';

buildConstantOperator(
  {
    name: 'true',
    description: 'pushes true onto the stack',
    labels: ['boolean', 'value'],
    signature: {
      output: [{ type: ValueType.boolean }]
    },
    samples: [
      {
        in: 'true',
        out: 'true'
      }
    ]
  },
  trueValue
);
