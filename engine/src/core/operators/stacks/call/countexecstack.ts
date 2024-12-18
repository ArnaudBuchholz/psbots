import { ValueType } from '@api/index.js';
import { toIntegerValue } from '@sdk/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

buildFunctionOperator(
  {
    name: 'countexecstack',
    description: 'retrieves the number of dictionaries in the dictionary stack',
    labels: ['callstack'],
    signature: {
      input: [],
      output: [ValueType.integer]
    },
    samples: [
      {
        in: 'countexecstack',
        out: '3'
      }
    ]
  },
  (state) => {
    const { operands, calls } = state;
    const integerResult = toIntegerValue(calls.length);
    if (!integerResult.success) {
      state.raiseException(integerResult.error);
      return;
    }
    operands.push(integerResult.value);
  }
);
