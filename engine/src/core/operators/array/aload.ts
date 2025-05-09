import { OPERATOR_STATE_FIRST_CALL, OPERATOR_STATE_POP } from '@sdk/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';
import { assert } from '@sdk/assert.js';

buildFunctionOperator(
  {
    name: 'aload',
    description: 'loads the items of the array in the operand stack and pushes the array itself',
    labels: ['array'],
    signature: {
      input: [{ type: 'array' }]
    },
    samples: [
      {
        in: '[ 1 2 3 ] aload pop',
        out: '1 2 3'
      }
    ]
  },
  (state) => {
    const { operands, calls } = state;
    const { top: arrayValue } = operands;
    assert(arrayValue.type === 'array');
    const { array } = arrayValue;
    if (calls.topOperatorState === OPERATOR_STATE_FIRST_CALL) {
      const reserved = operands.reserve(1 + array.length);
      if (!reserved.success) {
        return reserved;
      }
      calls.topOperatorState = 1;
      return { success: true, value: undefined };
    }
    const index = calls.topOperatorState - 1;
    if (index >= array.length) {
      calls.topOperatorState = OPERATOR_STATE_POP;
      return { success: true, value: undefined };
    }
    const value = array.at(index);
    arrayValue.tracker?.addValueRef(arrayValue);
    const pushed = operands.popush(1, value, arrayValue);
    arrayValue.tracker?.releaseValue(arrayValue);
    calls.topOperatorState = index + 2;
    return pushed;
  }
);
