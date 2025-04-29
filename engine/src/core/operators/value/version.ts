import { toStringValue } from '@sdk/index.js';
import { buildConstantOperator } from '../operators.js';

const VERSION = '@psbots/engine@0.0.1';

buildConstantOperator(
  {
    name: 'version',
    description: 'returns a string that identifies the version of the engine',
    labels: ['value'],
    signature: {
      output: [{ type: 'string' }]
    },
    samples: [
      {
        in: 'version type',
        out: '/string'
      }
    ]
  },
  toStringValue(VERSION)
);
