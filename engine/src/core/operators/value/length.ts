import type { Value } from '@api/index.js';
import { ValueType } from '@api/index.js';
import { toIntegerValue, TypeCheckException } from '@sdk/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

import length from './length.json' with { type: 'json' };

const implementations: { [type in ValueType]?: (container: Value<type>) => number } = {
  [ValueType.string]: ({ string }) => string.length,
  [ValueType.array]: ({ array }) => array.length,
  [ValueType.dictionary]: ({ dictionary }) => dictionary.names.length
};

buildFunctionOperator(length, function ({ operands }, value: Value) {
  const implementation = implementations[value.type];
  if (implementation === undefined) {
    throw new TypeCheckException();
  }
  operands.pop();
  operands.push(toIntegerValue(implementation(value as never)));
});
