import { buildFunctionOperator } from '@core/operators/operators.js';
import { openWithMark } from '@core/operators/openClose.js';

buildFunctionOperator(
  {
    name: '[',
    description: 'marks the beginning of an array',
    labels: ['array', 'mark'],
    signature: {
      output: [{ type: 'mark' }]
    },
    samples: [
      {
        description: 'builds an array and check length and type',
        in: '[ 1 2 3 ] dup length exch type',
        out: '3 /array'
      }
    ]
  },
  openWithMark
);
