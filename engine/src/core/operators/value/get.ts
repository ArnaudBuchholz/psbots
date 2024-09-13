import type { Value } from '@api/index.js';
import { ValueType } from '@api/index.js';
import { RangeCheckException, toStringValue, TypeCheckException, UndefinedException } from '@sdk/index.js';
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

const implementations: { [type in ValueType]?: (container: Value<type>, index: Value) => Value } = {
  [ValueType.string]: ({ string, tracker }, index) =>
    Object.assign(toStringValue(string.charAt(checkPos(index, string.length)), { tracker })),

  [ValueType.array]: ({ array }, index) => array.at(checkPos(index, array.length))!, // length is validated

  [ValueType.dictionary]: ({ dictionary }, index) => {
    if (index.type !== ValueType.string) {
      throw new TypeCheckException();
    }
    const { string: name } = index;
    if (!dictionary.names.includes(name)) {
      throw new UndefinedException();
    }
    return dictionary.lookup(name)!; // name is validated
  }
};

buildFunctionOperator(
  {
    name: 'get',
    description: 'returns an indexed item from the value',
    labels: ['generic'],
    signature: {
      input: [null, null],
      output: [null]
    },
    samples: [
      {
        description: 'returns the Nth item of an array',
        in: '[ 1 2 3 ] 1 get',
        out: '2'
      },
      {
        description: 'returns the Nth item of an executable array',
        in: '{ 1 2 3 } 1 get',
        out: '2'
      },
      {
        description: 'fails if invalid index for the array',
        in: '[ 1 2 3 ] "a" get',
        out: '[ 1 2 3 ] "a" typecheck'
      },
      {
        description: 'fails if out of bound index for the array',
        in: '[ 1 2 3 ] -1 get',
        out: '[ 1 2 3 ] -1 rangecheck'
      },
      {
        description: 'fails if out of bound index for the array',
        in: '[ 1 2 3 ] 3 get',
        out: '[ 1 2 3 ] -1 rangecheck'
      },
      {
        description: 'returns the Nth character of a string',
        in: '"abc" 1 get',
        out: '"b"'
      },
      {
        description: 'fails if invalid index for a string',
        in: '"abc" "a" get',
        out: '"abc" "a" typecheck'
      },
      {
        description: 'fails if out of bound index for a string',
        in: '"abc" -1 get',
        out: '"abc" -1 rangecheck'
      },
      {
        description: 'fails if out of bound index for a string',
        in: '"abc" 3 get',
        out: '"abc" 3 rangecheck'
      },
      {
        description: 'returns the indexed item of a dictionary',
        in: 'systemdict "get" get',
        out: '{ get } bind 0 get'
      },
      {
        description: 'fails if invalid index for a dictionary',
        in: 'systemdict 0 get',
        out: 'systemdict 0 typecheck'
      },
      {
        description: 'fails if unknown index for a dictionary',
        in: 'systemdict "not an operator" get',
        out: 'systemdict "not an operator" undefined'
      },
      {
        description: 'fails if not a container',
        in: '1 1 get',
        out: '1 1 typecheck'
      },
      {
        description: 'fails if not a container',
        in: 'false 1 get',
        out: 'false 1 typecheck'
      },
      {
        description: 'fails if not a container',
        in: 'mark 1 get',
        out: 'mark 1 typecheck'
      }
    ]
  },
  ({ operands }, container: Value, index: Value) => {
    const implementation = implementations[container.type];
    if (implementation === undefined) {
      throw new TypeCheckException();
    }
    const output = implementation(container as never, index);
    output.tracker?.addValueRef(output);
    try {
      operands.pop();
      operands.pop();
      operands.push(output);
    } finally {
      output.tracker?.releaseValue(output);
    }
  }
);
