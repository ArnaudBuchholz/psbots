import { UnmatchedMarkException } from '@sdk/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

buildFunctionOperator(
  {
    name: 'unmatchedmark',
    description: 'throws the exception : Unmatched mark in the operand stack',
    labels: ['exception'],
    signature: {
      exceptions: ['unmatchedmark']
    },
    samples: [
      {
        in: 'unmatchedmark',
        out: 'unmatchedmark'
      }
    ]
  },
  () => ({ success: false, error: new UnmatchedMarkException() })
);
