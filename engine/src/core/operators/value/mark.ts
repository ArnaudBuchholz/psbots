import { markValue } from '@api/index.js';
import { buildConstantOperator } from '../operators.js';

buildConstantOperator(
  {
    name: 'mark',
    description: 'pushes a mark in the operand stack',
    labels: ['value', 'mark'],
    signature: {
      output: [{ type: 'mark' }]
    },
    samples: [
      {
        in: '1 2 mark',
        out: '1 2 mark'
      },
      {
        description: 'marks part of the stack for operations',
        in: '1 2 mark 3 4 5 cleartomark',
        out: '1 2'
      }
    ]
  },
  markValue
);
