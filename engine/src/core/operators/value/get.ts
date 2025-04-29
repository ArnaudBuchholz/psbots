import type { Result, Value } from '@api/index.js';
import { ValueType } from '@api/index.js';
import { assert, checkPos, toStringValue } from '@sdk/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';
import { MemoryTracker } from '@core/MemoryTracker.js';

/** Returned value is addRef'ed */
const implementations: { [type in ValueType]?: (container: Value<type>, index: Value) => Result<Value> } = {
  ['string']: ({ string, tracker }, index) => {
    assert(tracker instanceof MemoryTracker);
    const posResult = checkPos(index, string.length);
    if (!posResult.success) {
      return posResult;
    }
    const stringResult = string.charAt(posResult.value);
    const referenced = tracker.addStringRef(stringResult);
    if (!referenced.success) {
      return referenced;
    }
    return { success: true, value: toStringValue(stringResult, { tracker }) };
  },

  ['array']: ({ array }, index) => {
    const posResult = checkPos(index, array.length);
    if (!posResult.success) {
      return posResult;
    }
    const value = array.at(posResult.value);
    value.tracker?.addValueRef(value);
    return { success: true, value };
  },

  ['dictionary']: ({ dictionary }, index) => {
    if (index.type !== 'name') {
      return { success: false, exception: 'typeCheck' };
    }
    const { name } = index;
    if (!dictionary.names.includes(name)) {
      return { success: false, exception: 'undefined' };
    }
    const value = dictionary.lookup(name);
    value.tracker?.addValueRef(value);
    return { success: true, value };
  }
};

buildFunctionOperator(
  {
    name: 'get',
    description: 'returns an indexed item from the value',
    labels: ['generic'],
    signature: {
      input: [{ type: 'null' }, { type: 'null' }],
      output: [{ type: 'null' }]
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
        description: 'returns the indexed item of a dictionary (handles reference counting)',
        in: '/test "abc" def userdict /test get',
        out: '/test "abc" def "abc"'
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
  ({ operands }, container, index) => {
    const implementation = implementations[container.type];
    if (implementation === undefined) {
      return { success: false, exception: 'typeCheck' };
    }
    const getResult = implementation(container as never, index);
    if (!getResult.success) {
      return getResult;
    }
    const { value } = getResult;
    const popushResult = operands.popush(2, value);
    value.tracker?.releaseValue(value);
    return popushResult;
  }
);
