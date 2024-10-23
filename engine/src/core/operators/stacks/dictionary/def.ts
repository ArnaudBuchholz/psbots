import { ValueType } from '@api/index.js';
import { InvalidAccessException } from '@sdk/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

buildFunctionOperator(
  {
    name: 'def',
    description: 'associates key with value in the current dictionary, the one on the top of the dictionary stack',
    labels: ['dictstack'],
    signature: {
      input: [ValueType.name, null],
      output: []
    },
    samples: [
      {
        in: '/test 1 def test',
        out: '/test 1 def 1'
      },
      {
        in: 'systemdict begin /test 1 def test',
        out: 'systemdict begin /test 1 invalidaccess'
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
