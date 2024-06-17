import type { MarkValue, OperatorValue, Value } from '@api/index.js';
import { ValueType } from '@api/index.js';
import { toIReadOnlyArray } from './toIReadOnlyArray';
import { isObject } from '@sdk/index.js';

export type CompatiblePrimitiveValue = string | number | boolean | Value;
export type CompatibleValue = CompatibleValue[] | { [key in string]: CompatibleValue }| CompatiblePrimitiveValue;

export function toValue(value: CompatibleValue): Value {
  const common: {
    isReadOnly: true;
    isExecutable: false;
    isShared: false;
  } = {
    isReadOnly: true,
    isExecutable: false,
    isShared: false
  };
  if (typeof value === 'string') {
    return {
      ...common,
      type: ValueType.string,
      string: value
    };
  }
  if (typeof value === 'boolean') {
    return {
      ...common,
      type: ValueType.boolean,
      isSet: value
    };
  }
  if (typeof value === 'number') {
    if (value % 1 !== 0) {
      throw new Error('Only integers are supported');
    }
    return {
      ...common,
      type: ValueType.integer,
      integer: value
    };
  }
  if (Array.isArray(value)) {

    return {
      ...common,
      type: ValueType.array,
      array: toIReadOnlyArray([])
    };
  }
  // if (isObject(value) && value.type in ValueType) {
  //   return value;
  // }
  return value;
}

const mark: MarkValue = {
  type: ValueType.mark,
  isReadOnly: true,
  isExecutable: false,
  isShared: false
}

toValue.mark = mark;

const operator: OperatorValue = {
  type: ValueType.operator,
  isReadOnly: true,
  isExecutable: true,
  isShared: false,
  operator: {
    name: 'operator'
  }
}

toValue.operator = operator;
