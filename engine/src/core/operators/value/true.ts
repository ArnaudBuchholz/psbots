import { ValueType } from '@api/index.js';
import { toBooleanValue } from '@sdk/index.js';
import { buildConstantOperator } from '../operators.js';

buildConstantOperator(
  {
    name: 'true',
    description: 'pushes true in the operand stack',
    labels: ['value'],
    signature: {
      input: [],
      output: [ValueType.boolean]
    },
    samples: [
      {
        in: 'true type',
        out: '/boolean'
      }
    ]
  },
  toBooleanValue(true)
);
