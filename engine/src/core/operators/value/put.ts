import type { IArray, IDictionary, Value } from '@api/index.js';
import { ValueType } from '@api/index.js';
import {
  InternalException,
  InvalidAccessException,
  RangeCheckException,
  toStringValue,
  TypeCheckException
} from '@sdk/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

import put from './put.json' with { type: 'json' };

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
    if (tracker === undefined) {
      throw new InternalException('Unexpected string with no tracker');
    }
    const pos = checkPos(index, string.length);
    if (value.type !== ValueType.integer) {
      throw new TypeCheckException();
    }
    const { integer: charCode } = value;
    if (charCode < 0 || charCode > 65535) {
      throw new RangeCheckException();
    }
    const newString = string.substring(0, pos) + String.fromCharCode(charCode) + string.substring(pos + 1);
    return Object.assign({ tracker }, toStringValue(newString));
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

buildFunctionOperator(put, function ({ operands }, container: Value, index: Value, value: Value) {
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
});
