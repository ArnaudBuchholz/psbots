import { ValueType } from '@api/index.js';
import { toBooleanValue } from '@sdk/index.js';
import { buildConstantOperator } from '../operators.js';

buildConstantOperator(
  {
    name: 'false',
    description: 'pushes false in the operand stack',
    labels: ['value'],
    signature: {
      input: [],
      output: [ValueType.boolean]
    },
    samples: [
      {
        in: 'false type',
        out: '"boolean"'
      }
    ]
  },
  toBooleanValue(false)
);
