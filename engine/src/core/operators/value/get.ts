import type { Result, Value } from '@api/index.js';
import { ValueType } from '@api/index.js';
import { RangeCheckException, toStringValue, TypeCheckException, UndefinedException } from '@sdk/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

function checkPos(index: Value, length: number): Result<number> {
  if (index.type !== ValueType.integer) {
    return { success: false, error: new TypeCheckException() };
  }
  const { integer: pos } = index;
  if (pos < 0 || pos >= length) {
    return { success: false, error: new RangeCheckException() };
  }
  return { success: true, value: pos };
}

const implementations: { [type in ValueType]?: (container: Value<type>, index: Value) => Result<Value> } = {
  [ValueType.string]: ({ string, tracker }, index) => {
    const posResult = checkPos(index, string.length);
    if (!posResult.success) {
      return posResult;
    }
    // TODO: need to allocate string first !
    return { success: true, value: Object.assign(toStringValue(string.charAt(posResult.value), { tracker })) }
  },

  [ValueType.array]: ({ array }, index) => {
    const posResult = checkPos(index, array.length);
    if (!posResult.success) {
      return posResult;
    }
    return { success: true, value: array.at(posResult.value) }
  },

  [ValueType.dictionary]: ({ dictionary }, index) => {
    if (index.type !== ValueType.name) {
      return { success: false, error: new TypeCheckException() };
    }
    const { name } = index;
    if (!dictionary.names.includes(name)) {
      return { success: false, error: new UndefinedException() };
    }
    return { success: true, value: dictionary.lookup(name) };
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
        in: '[ 1 2 3 ] /a get',
        out: '[ 1 2 3 ] /a typecheck'
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
        in: 'systemdict /get get',
        out: '{ get } bind 0 get'
      },
      {
        description: 'fails if invalid index for a dictionary',
        in: 'systemdict 0 get',
        out: 'systemdict 0 typecheck'
      },
      {
        description: 'fails if unknown index for a dictionary',
        in: 'systemdict /not_an_operator get',
        out: 'systemdict /not_an_operator undefined'
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
  (state, container: Value, index: Value) => {
    const { operands } = state;
    const implementation = implementations[container.type];
    if (implementation === undefined) {
      state.raiseException(new TypeCheckException());
      return;
    }
    const result = implementation(container as never, index);
    if (!result.success) {
      state.raiseException(result.error);
      return;
    }
    const output = result.value;
    output.tracker?.addValueRef(output);
    // TODO: find a way to push first in case pop fails
    operands.pop();
    operands.pop();
    operands.push(output);
    output.tracker?.releaseValue(output);
  }
);
