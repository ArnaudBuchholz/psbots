import type { IReadOnlyArray, IReadOnlyDictionary, MarkValue, OperatorValue, Value } from '@api/index.js';
import { ValueType } from '@api/index.js';
import { isObject } from '@sdk/index.js';

export type CompatiblePrimitiveValue = string | number | boolean | Value;
export type CompatibleValue = CompatibleValue[] | { [key in string]: CompatibleValue } | CompatiblePrimitiveValue;

function isValue(value: unknown): value is Value {
  return isObject(value) && value.type in ValueType;
}

export function toIReadOnlyArray(values: CompatibleValue[]): IReadOnlyArray {
  return {
    get length() {
      return values.length;
    },

    at(index): Value | null {
      const value = values[index];
      if (value === undefined) {
        return null;
      }
      return toValue(value);
    }
  };
}

export function toIReadOnlyDictionary(mapping: { [key in string]: CompatibleValue }): IReadOnlyDictionary {
  return {
    get names() {
      return Object.keys(mapping);
    },

    lookup(name: string): Value | null {
      const value = mapping[name];
      if (value === undefined) {
        return null;
      }
      return toValue(value);
    }
  };
}

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
      array: toIReadOnlyArray(value.map(toValue))
    };
  }
  if (isValue(value)) {
    return value;
  }
  return {
    ...common,
    type: ValueType.dictionary,
    dictionary: toIReadOnlyDictionary(value)
  };
}

const mark: MarkValue = {
  type: ValueType.mark,
  isReadOnly: true,
  isExecutable: false,
  isShared: false
};

toValue.mark = mark;

const operator: OperatorValue = {
  type: ValueType.operator,
  isReadOnly: true,
  isExecutable: true,
  isShared: false,
  operator: {
    name: 'operator'
  }
};

toValue.operator = operator;
