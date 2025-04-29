import type { IInternalState } from '@sdk/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';
import { openWithMark } from '@core/operators/openClose.js';

buildFunctionOperator(
  {
    name: '<<',
    aliases: ['«'],
    description: 'marks the beginning of a dictionary',
    labels: ['dictionary', 'mark'],
    signature: {
      output: [{ type: 'mark' }]
    },
    samples: [
      {
        description: 'builds a dictionary check length and type',
        in: '<< /test 123 >> dup length exch type',
        out: '1 /dictionary'
      },
      {
        description: 'builds a dictionary check length and type',
        in: '« /test 123 » dup length exch type',
        out: '1 /dictionary'
      }
    ]
  },
  (state: IInternalState) => openWithMark(state)
);
