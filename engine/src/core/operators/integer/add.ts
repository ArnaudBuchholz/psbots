import { ValueType } from '@api/index.js';
import { toIntegerValue } from '@sdk/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

buildFunctionOperator(
  {
    name: 'add',
    description: 'adds two integers',
    labels: ['integer', 'math'],
    signature: {
      input: [{ type: ValueType.integer }, { type: ValueType.integer }],
      output: [{ type: ValueType.integer }]
    },
    samples: [
      {
        in: '1 2 add',
        out: '3'
      }
    ]
  },
  (state, { integer: value1 }, { integer: value2 }) => {
    const { operands } = state;
    const integerResult = toIntegerValue(value1 + value2);
    if (!integerResult.success) {
      return integerResult;
    }
    return operands.popush(2, integerResult.value);
  }
);
