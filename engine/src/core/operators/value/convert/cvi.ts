import { ValueType } from '@api/index.js';
import type { Value } from '@api/index.js';
import { toIntegerValue, TypeCheckException } from '@sdk/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

buildFunctionOperator(
  {
    name: 'cvi',
    description: 'converts to integer',
    labels: ['value', 'generic', 'conversion'],
    signature: {
      input: [null],
      output: [ValueType.integer]
    },
    samples: [
      {
        in: '1 cvi',
        out: '1'
      },
      {
        in: '"1" cvi',
        out: '1'
      },
      {
        description: 'fails if number goes beyond limit',
        in: '"9007199254740992" cvi',
        out: 'undefinedresult'
      },
      {
        in: '/1 cvi',
        out: 'typecheck'
      },
      {
        in: '<< >> cvi',
        out: 'typecheck'
      }
    ]
  },
  ({ operands }, value: Value) => {
    if (value.type !== ValueType.integer) {
      if (value.type === ValueType.string) {
        const integer = parseInt(value.string, 10);
        operands.pop();
        operands.push(toIntegerValue(integer));
      } else {
        throw new TypeCheckException();
      }
    }
  }
);