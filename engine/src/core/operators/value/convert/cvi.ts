import type { Value } from '@api/index.js';
import { ValueType } from '@api/index.js';
import { toIntegerValue } from '@sdk/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

buildFunctionOperator(
  {
    name: 'cvi',
    description: 'converts to integer',
    labels: ['value', 'generic', 'conversion'],
    signature: {
      input: [{ type: ValueType.null }],
      output: [{ type: ValueType.integer }]
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
        const integerValueResult = toIntegerValue(integer);
        if (!integerValueResult.success) {
          return integerValueResult;
        }
        return operands.popush(1, integerValueResult.value);
      } else {
        return { success: false, exception: 'typeCheck' };
      }
    }
    return { success: true, value: undefined };
  }
);
