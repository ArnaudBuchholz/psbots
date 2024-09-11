import type { Value } from '@api/index.js';
import { ValueType } from '@api/index.js';
import {
  InternalException,
  RangeCheckException,
  toStringValue,
  TypeCheckException,
  UndefinedException
} from '@sdk/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

import get from './get.json' with { type: 'json' };

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
  [ValueType.string]: ({ string, tracker }, index) => {
    if (tracker === undefined) {
      throw new InternalException('Unexpected string with no tracker');
    }
    return Object.assign({ tracker }, toStringValue(string.charAt(checkPos(index, string.length))));
  },

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

buildFunctionOperator(get, function ({ operands }, container: Value, index: Value) {
  const implementation = implementations[container.type];
  if (implementation === undefined) {
    throw new TypeCheckException();
  }
  const output = implementation(container as never, index);
  operands.pop();
  operands.pop();
  operands.push(output);
});
