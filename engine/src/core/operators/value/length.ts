import type { Value, ValueType } from '@api/index.js';
import { assert, toIntegerValue } from '@sdk/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

const implementations: { [type in ValueType]?: (container: Value<type>) => number } = {
  string: ({ string }) => string.length,
  array: ({ array }) => array.length,
  dictionary: ({ dictionary }) => dictionary.names.length
};

buildFunctionOperator(
  {
    name: 'length',
    description: 'returns the length of the value',
    labels: ['generic'],
    signature: {
      input: [{ type: 'null' }],
      output: [{ type: 'integer' }]
    },
    samples: [
      {
        description: 'returns the number of items in an array',
        in: '[ 1 2 3 ] length',
        out: '3'
      },
      {
        description: 'returns the number of items in an executable array',
        in: '{ 1 2 3 } length',
        out: '3'
      },
      {
        description: 'returns the size of a string',
        in: '"abc" length',
        out: '3'
      },
      {
        description: 'returns the number of keys in a dictionary',
        in: 'systemdict length 0 gt',
        out: 'true'
      },
      {
        description: 'fails if not a container',
        in: '1 length',
        out: '1 typecheck'
      },
      {
        description: 'fails if not a container',
        in: 'false length',
        out: 'false typecheck'
      },
      {
        description: 'fails if not a container',
        in: 'mark length',
        out: 'mark typecheck'
      }
    ]
  },
  ({ operands }, value) => {
    const implementation = implementations[value.type];
    if (implementation === undefined) {
      return { success: false, exception: 'typeCheck' };
    }
    const integerResult = toIntegerValue(implementation(value as never));
    assert(integerResult.success); // cannot exceed limit
    return operands.popush(1, integerResult.value);
  }
);
