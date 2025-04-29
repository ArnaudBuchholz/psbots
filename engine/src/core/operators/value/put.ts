import type { IArray, IDictionary, Result, Value, ValueType } from '@api/index.js';
import { assert, checkPos, toStringValue } from '@sdk/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';
import { MemoryTracker } from '@core/MemoryTracker.js';

/** Returned value is addRef'ed */
const implementations: { [type in ValueType]?: (container: Value<type>, index: Value, value: Value) => Result<Value> } =
  {
    string: ({ string, tracker }, index, value) => {
      assert(tracker instanceof MemoryTracker);
      if (value.type !== 'integer') {
        return { success: false, exception: 'typeCheck' };
      }
      const { integer: charCode } = value;
      if (charCode < 0 || charCode > 65_535) {
        return { success: false, exception: 'rangeCheck' };
      }
      const posResult = checkPos(index, string.length);
      if (!posResult.success) {
        return posResult;
      }
      const stringResult =
        string.slice(0, Math.max(0, posResult.value)) +
        String.fromCodePoint(charCode) +
        string.slice(Math.max(0, posResult.value + 1));
      const referenced = tracker.addStringRef(stringResult);
      if (!referenced.success) {
        return referenced;
      }
      return { success: true, value: toStringValue(stringResult, { tracker }) };
    },

    array: (container, index, value) => {
      const { array, isReadOnly } = container;
      if (isReadOnly) {
        return { success: false, exception: 'invalidAccess' };
      }
      const posResult = checkPos(index, array.length);
      if (!posResult.success) {
        return posResult;
      }
      const setResult = (array as IArray).set(posResult.value, value);
      if (!setResult.success) {
        return setResult;
      }
      container.tracker?.addValueRef(container);
      return { success: true, value: container };
    },

    dictionary: (container, index, value) => {
      const { dictionary, isReadOnly } = container;
      if (isReadOnly) {
        return { success: false, exception: 'invalidAccess' };
      }
      if (index.type !== 'name') {
        return { success: false, exception: 'typeCheck' };
      }
      const { name } = index;
      const defined = (dictionary as IDictionary).def(name, value);
      if (!defined.success) {
        return defined;
      }
      container.tracker?.addValueRef(container);
      return { success: true, value: container };
    }
  };

buildFunctionOperator(
  {
    name: 'put',
    description: 'sets an indexed item in the value',
    postScriptDeviation: 'returns the modified object or a new string',
    labels: ['generic'],
    signature: {
      input: [{ type: 'null' }, { type: 'null' }, { type: 'null' }],
      output: [{ type: 'null' }]
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
        in: 'userdict /test 123 put pop test',
        out: 'userdict /test 456 put pop 123'
      },
      {
        description: 'fails if the dictionary is not writable',
        in: 'systemdict /test 123 put',
        out: 'systemdict /test 123 invalidaccess'
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
  ({ operands }, container, index, value) => {
    const implementation = implementations[container.type];
    if (implementation === undefined) {
      return { success: false, exception: 'typeCheck' };
    }
    const putResult = implementation(container as never, index, value);
    if (!putResult.success) {
      return putResult;
    }
    const { value: output } = putResult;
    const popushResult = operands.popush(3, output);
    container.tracker?.releaseValue(output);
    return popushResult;
  }
);
