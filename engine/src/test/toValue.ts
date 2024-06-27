import type {
  IArray,
  IDictionary,
  IReadOnlyArray,
  IReadOnlyDictionary,
  MarkValue,
  OperatorValue,
  Value
} from '@api/index.js';
import { ValueType } from '@api/index.js';
import { isObject } from '@sdk/index.js';

export type CompatiblePrimitiveValue = string | number | boolean | Value;
export type CompatibleValue = CompatibleValue[] | { [key in string]: CompatibleValue } | CompatiblePrimitiveValue;

function isValue(value: unknown): value is Value {
  return isObject(value) && value.type in ValueType;
}

function releasePreviousValue(previousValue: Value | undefined): Value | null {
  if (
    previousValue !== undefined &&
    previousValue.tracker !== undefined &&
    !previousValue.tracker.releaseValue(previousValue)
  ) {
    return null;
  }
  return previousValue ?? null;
}

export function toIArray(values: Value[], readOnly: boolean): IReadOnlyArray | IArray {
  const array = [...values];
  array.forEach((value) => {
    if (value.tracker) {
      value.tracker.addValueRef(value);
    }
  });
  const iArray: IReadOnlyArray & Partial<IArray> = {
    get length() {
      return array.length;
    },

    at(index: number): Value | null {
      return array[index] ?? null;
    },

    set(index: number, value: Value): Value | null {
      const previousValue = releasePreviousValue(array[index]);
      array[index] = value;
      if (value.tracker) {
        value.tracker.addValueRef(value);
      }
      return previousValue;
    }
  };
  if (readOnly) {
    delete iArray.set;
  }
  return iArray;
}

export function toIDictionary(
  mapping: { [key in string]: Value },
  readOnly: boolean
): IReadOnlyDictionary | IDictionary {
  const dictionary = { ...mapping };
  Object.values(dictionary).forEach((value) => {
    if (value.tracker) {
      value.tracker.addValueRef(value);
    }
  });
  const iDictionary: IReadOnlyDictionary & Partial<IDictionary> = {
    get names() {
      return Object.keys(dictionary);
    },

    lookup(name: string): Value | null {
      return dictionary[name] ?? null;
    },

    def(name: string, value: Value): Value | null {
      const previousValue = releasePreviousValue(dictionary[name]);
      dictionary[name] = value;
      if (value.tracker) {
        value.tracker.addValueRef(value);
      }
      return previousValue;
    }
  };
  if (readOnly) {
    delete iDictionary.def;
  }
  return iDictionary;
}

export function toValue(value: CompatibleValue, readOnly: boolean = false): Value {
  const common: {
    isReadOnly: true;
    isExecutable: false;
  } = {
    isReadOnly: true,
    isExecutable: false
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
      array: toIArray(
        value.map((value) => toValue(value, readOnly)),
        readOnly
      )
    };
  }
  if (isValue(value)) {
    return value;
  }
  const mapping: { [key in string]: Value } = {};
  Object.entries(value).forEach(([name, value]) => {
    mapping[name] = toValue(value, readOnly);
  });
  return {
    ...common,
    type: ValueType.dictionary,
    dictionary: toIDictionary(mapping, readOnly)
  };
}

const mark: MarkValue = {
  type: ValueType.mark,
  isReadOnly: true,
  isExecutable: false
};

toValue.mark = mark;

const operator: OperatorValue = {
  type: ValueType.operator,
  isReadOnly: true,
  isExecutable: true,
  operator: {
    name: 'operator'
  }
};

toValue.operator = operator;
