import { buildFunctionOperator } from '@core/operators/operators.js';

buildFunctionOperator(
  {
    name: 'begin',
    description: 'pushes the dictionary on the dictionary stack, making it the current one',
    labels: ['dictstack'],
    signature: {
      input: [{ type: 'dictionary' }]
    },
    samples: [
      {
        in: '<< /test 1 >> begin test end',
        out: '1'
      }
    ]
  },
  ({ operands, dictionaries }, value) => {
    const result = dictionaries.push(value);
    if (result.success) {
      operands.pop();
    }
    return result;
  }
);
