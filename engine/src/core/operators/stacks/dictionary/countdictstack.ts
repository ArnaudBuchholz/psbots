import { ValueType } from '@api/index.js';
import { toIntegerValue } from '@sdk/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

buildFunctionOperator(
  {
    name: 'countdictstack',
    description: 'retrieves the number of dictionaries in the dictionary stack',
    labels: ['dictstack'],
    signature: {
      input: [],
      output: [ValueType.integer]
    },
    samples: [
      {
        in: 'countdictstack',
        out: '4'
      }
    ]
  },
  (state) => {
    const { operands, dictionaries } = state;
    const integerResult = toIntegerValue(dictionaries.length);
    if (!integerResult.success) {
      state.raiseException(integerResult.error);
      return;
    }
    operands.push(integerResult.value);
  }
);
