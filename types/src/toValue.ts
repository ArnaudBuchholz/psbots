import type {
  ArrayValue,
  DictionaryValue,
  IArray,
  IDictionary,
  IReadOnlyArray,
  IReadOnlyDictionary,
  IValuePermissions,
  Value
} from './index.js';
import { nullValue, trueValue, falseValue } from './index.js';

function toIntegerValue(integer: number): Value<'integer'> {
  if (integer % 1 !== 0 || integer < Number.MIN_SAFE_INTEGER || integer > Number.MAX_SAFE_INTEGER) {
    throw new Error('undefinedResult');
  }
  return {
    type: 'integer',
    isExecutable: false,
    isReadOnly: true,
    integer
  };
}

export function toStringValue(
  string: string,
  { isExecutable = false }: { isExecutable?: boolean; } = {}
): Value<'string'> {
  return {
    type: 'string',
    isExecutable,
    isReadOnly: true,
    string
  };
}

export function toNameValue(
  name: string,
  { isExecutable = false }: { isExecutable?: boolean } = {}
): Value<'name'> {
  return {
    type: 'name',
    isExecutable,
    isReadOnly: true,
    name
  };
}

function _toIReadOnlyArray(values: Value[]): { array: Value[]; iArray: IReadOnlyArray } {
  const array = [...values];
  const readOnlyArray: IReadOnlyArray = {
    get capacity() {
      return 0;
    },

    get length() {
      return array.length;
    },

    at(index: number): Value {
      return array[index] ?? nullValue;
    }
  };
  return { array, iArray: readOnlyArray };
}

function toIArray(values: Value[]): IArray {
  const { array, iArray } = _toIReadOnlyArray(values);
  return Object.assign(iArray, {
    resize(capacity: number) {},
    set(index: number, value: Value): void {
      array[index] = value;
    }
  });
}

type ValueDictionary = { [key in string]: Value };

function _toIReadOnlyDictionary(mapping: ValueDictionary): {
  dictionary: ValueDictionary;
  iDictionary: IReadOnlyDictionary;
} {
  const dictionary = { ...mapping };
  const readOnlyDictionary: IReadOnlyDictionary & Partial<IDictionary> = {
    get names() {
      return Object.keys(dictionary);
    },

    lookup(name: string): Value {
      return dictionary[name] ?? nullValue;
    }
  };
  return { dictionary, iDictionary: readOnlyDictionary };
}

function toIDictionary(mapping: ValueDictionary): IDictionary {
  const { dictionary, iDictionary } = _toIReadOnlyDictionary(mapping);
  return Object.assign(iDictionary, {
    def(name: string, value: Value): void {
      dictionary[name] = value;
    }
  });
}

type CompatiblePrimitiveValue = string | symbol | number | boolean | Value | (() => void);
type CompatibleValue = CompatibleValue[] | { [key in string]: CompatibleValue } | CompatiblePrimitiveValue;

export function toValue(value: boolean, permissions?: Partial<IValuePermissions>): Value<'boolean'>;
export function toValue(value: number, permissions?: Partial<IValuePermissions>): Value<'integer'>;
export function toValue(value: string, permissions?: Partial<IValuePermissions>): Value<'string'>;
export function toValue(name: symbol, permissions?: Partial<IValuePermissions>): Value<'name'>;
export function toValue(value: CompatibleValue[], permissions?: Partial<IValuePermissions>): ArrayValue;
export function toValue(
  value: { [key in string]: CompatibleValue },
  permissions?: Partial<IValuePermissions>
): DictionaryValue;
export function toValue(value: CompatibleValue, permissions?: Partial<IValuePermissions>): Value;
// eslint-disable-next-line sonarjs/cognitive-complexity -- no value in reducing complexity
export function toValue(
  value: CompatibleValue,
  { isReadOnly = false, isExecutable = false }: Partial<IValuePermissions> = {}
): Value {
  if (typeof value === 'string') {
    return toStringValue(value, { isExecutable });
  }
  if (typeof value === 'symbol') {
    const key = Symbol.keyFor(value);
    if (key === undefined) {
      throw new Error('Use Symbol.for to ensure string can be extracted');
    }
    return toNameValue(key, { isExecutable });
  }
  if (typeof value === 'boolean') {
    return value ? trueValue : falseValue;
  }
  if (typeof value === 'number') {
    return toIntegerValue(value);
  }
  if (Array.isArray(value)) {
    if (isExecutable) {
      return {
        type: 'array',
        isExecutable,
        isReadOnly: true,
        array: toIArray(value.map((item) => toValue(item, { isReadOnly, isExecutable })))
      };
    }
    return {
      type: 'array',
      isExecutable,
      isReadOnly,
      array: toIArray(value.map((item) => toValue(item, { isReadOnly, isExecutable })))
    };
  }
  const mapping: { [key in string]: Value } = {};
  for (const [name, item] of Object.entries(value)) {
    mapping[name] = toValue(item, { isReadOnly, isExecutable });
  }
  return {
    type: 'dictionary',
    isExecutable: false,
    isReadOnly,
    dictionary: toIDictionary(mapping)
  };
}
