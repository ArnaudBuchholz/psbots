import { ValueType } from '@api/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

buildFunctionOperator(
  {
    name: 'begin',
    description: 'pushes the dictionary on the dictionary stack, making it the current one',
    labels: ['dictstack'],
    signature: {
      input: [ValueType.dictionary], // TODO: pass as Value
      output: []
    },
    samples: [
      {
        in: '<< /test 1 >> begin test end',
        out: '1'
      }
    ]
  },
  ({ operands, dictionaries }) => {
    dictionaries.push(operands.top);
    operands.pop();
  }
);