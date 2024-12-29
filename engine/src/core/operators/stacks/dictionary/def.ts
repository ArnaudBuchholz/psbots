import { ValueType } from '@api/index.js';
import { InvalidAccessException } from '@sdk/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

buildFunctionOperator(
  {
    name: 'def',
    description: 'associates key with value in the current dictionary, the one on the top of the dictionary stack',
    labels: ['dictstack'],
    signature: {
      input: [{ type: ValueType.name }, { type: ValueType.null }]
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
  ({ operands, dictionaries }, { name }, value) => {
    if (dictionaries.top.isReadOnly) {
      return { success: false, error: new InvalidAccessException() };
    }
    const { dictionary } = dictionaries.top;
    const defResult = dictionary.def(name, value);
    if (!defResult.success) {
      return defResult;
    }
    return operands.popush(2);
  }
);
