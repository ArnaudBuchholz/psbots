import { ValueType } from '@api/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';
import { InvalidAccessException } from '@sdk/exceptions';

buildFunctionOperator(
  {
    name: 'def',
    description: 'associates key with value in the current dictionary-the one on the top of the dictionary stack',
    labels: ['dictstack'],
    signature: {
      input: [ValueType.string, null],
      output: []
    },
    samples: [
      {
        in: '"test" 1 def test',
        out: '"test" 1 def 1'
      }
    ]
  },
  ({ operands, dictionaries }, name, value) => {
    if (dictionaries.top.isReadOnly) {
      throw new InvalidAccessException();
    }
    const { dictionary } = dictionaries.top;
    dictionary.def(name, value);
    operands.pop();
    operands.pop();
  }
);
