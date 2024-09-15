import type { IArray, IDictionary, Value } from '@api/index.js';
import { ValueType } from '@api/index.js';
import { InvalidAccessException, RangeCheckException, toStringValue, TypeCheckException } from '@sdk/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

function checkPos(index: Value, length: number): number {
  if (index.type !== ValueType.integer) {
    throw new TypeCheckException();
  }
  const { integer: pos } = index;
  if (pos < 0 || pos >= length) {
    throw new RangeCheckException();
  }
  return pos;
}

const implementations: { [type in ValueType]?: (container: Value<type>, index: Value, value: Value) => Value } = {
  [ValueType.string]: ({ string, tracker }, index, value) => {
    const pos = checkPos(index, string.length);
    if (value.type !== ValueType.integer) {
      throw new TypeCheckException();
    }
    const { integer: charCode } = value;
    if (charCode < 0 || charCode > 65535) {
      throw new RangeCheckException();
    }
    const newString = string.substring(0, pos) + String.fromCharCode(charCode) + string.substring(pos + 1);
    return Object.assign({ tracker }, toStringValue(newString, { tracker }));
  },

  [ValueType.array]: (container, index, value) => {
    const { array, isReadOnly } = container;
    if (isReadOnly) {
      throw new InvalidAccessException();
    }
    (array as IArray).set(checkPos(index, array.length), value);
    return container;
  },

  [ValueType.dictionary]: (container, index, value) => {
    const { dictionary, isReadOnly } = container;
    if (isReadOnly) {
      throw new InvalidAccessException();
    }
    if (index.type !== ValueType.string) {
      throw new TypeCheckException();
    }
    const { string: name } = index;
    (dictionary as IDictionary).def(name, value);
    return container;
  }
};

buildFunctionOperator(
  {
    name: 'put',
    description: 'sets an indexed item in the value',
    postScriptDeviation: 'returns the modified object or a new string',
    labels: ['generic'],
    signature: {
      input: [null, null, null],
      output: [null]
    },
    samples: [
      {
        description: 'sets the Nth item of an array',
        in: '[ 1 2 3 ] 1 5 put',
        out: '[ 1 5 3 ]'
      },
      {
        description: 'fails if the array is not writable',
        in: '{ 1 2 3 } 1 5 put',
        out: '{ 1 2 3 } 1 5 invalidaccess'
      },
      {
        description: 'fails if invalid index for the array',
        in: '[ 1 2 3 ] "a" 5 put',
        out: '[ 1 2 3 ] "a" 5 typecheck'
      },
      {
        description: 'fails if out of bound index for the array',
        in: '[ 1 2 3 ] -1 5 put',
        out: '[ 1 2 3 ] -1 5 rangecheck'
      },
      {
        description: 'fails if out of bound index for the array',
        in: '[ 1 2 3 ] 3 5 put',
        out: '[ 1 2 3 ] 3 5 rangecheck'
      },
      {
        description: 'sets the Nth character of a string (returns a new string, using ascii code)',
        in: '"abc" 1 66 put',
        out: '"aBc"'
      },
      {
        description: 'fails if setting an invalid value',
        in: '"abc" 1 "B" put',
        out: '"abc" 1 "B" typecheck'
      },
      {
        description: 'fails if setting an invalid value',
        in: '"abc" 1 -1 put',
        out: '"abc" 1 -1 rangecheck'
      },
      {
        description: 'fails if setting an invalid value',
        in: '"abc" 1 65536 put',
        out: '"abc" 1 65536 rangecheck'
      },
      {
        description: 'fails if invalid index for a string',
        in: '"abc" "a" 66 put',
        out: '"abc" "a" 66 typecheck'
      },
      {
        description: 'fails if out of bound index for a string',
        in: '"abc" -1 66 put',
        out: '"abc" -1 66 rangecheck'
      },
      {
        description: 'fails if out of bound index for a string',
        in: '"abc" 3 66 put',
        out: '"abc" 3 66 rangecheck'
      },
      {
        description: 'sets an indexed item of a dictionary',
        in: 'userdict "test" 123 put "test" get',
        out: '123'
      },
      {
        description: 'fails if the dictionary is not writable',
        in: 'systemdict "test" 123 put',
        out: 'systemdict "test" 123 invalidaccess'
      },
      {
        description: 'fails if invalid index for a dictionary',
        in: 'userdict 0 123 put',
        out: 'userdict 0 123 typecheck'
      },
      {
        description: 'fails if not a container',
        in: '1 0 1 put',
        out: '1 0 1 typecheck'
      },
      {
        description: 'fails if not a container',
        in: 'false 0 1 put',
        out: 'false 0 1 typecheck'
      },
      {
        description: 'fails if not a container',
        in: 'mark 0 1 put',
        out: 'mark 0 1 typecheck'
      }
    ]
  },
  ({ operands }, container: Value, index: Value, value: Value) => {
    const implementation = implementations[container.type];
    if (implementation === undefined) {
      throw new TypeCheckException();
    }
    const output = implementation(container as never, index, value);
    output.tracker?.addValueRef(output);
    try {
      operands.pop();
      operands.pop();
      operands.pop();
      operands.push(output);
    } finally {
      output.tracker?.releaseValue(output);
    }
  }
);
