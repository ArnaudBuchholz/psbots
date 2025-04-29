import { buildFunctionOperator } from '@core/operators/operators.js';

buildFunctionOperator(
  {
    name: 'def',
    description: 'associates key with value in the current dictionary, the one on the top of the dictionary stack',
    labels: ['dictstack'],
    signature: {
      input: [{ type: 'name' }, { type: 'null' }]
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
      return { success: false, exception: 'invalidAccess' };
    }
    const { dictionary } = dictionaries.top;
    const defined = dictionary.def(name, value);
    if (!defined.success) {
      return defined;
    }
    return operands.popush(2);
  }
);
