import type {
  ArrayValue,
  DictionaryValue,
  IArray,
  IDictionary,
  IReadOnlyArray,
  IReadOnlyDictionary,
  IValuePermissions,
  OperatorValue,
  Value
} from '@api/index.js';
import { markValue, ValueType } from '@api/index.js';
import type { IOperator } from '@sdk/index.js';
import { isObject, OperatorType, toBooleanValue, toIntegerValue, toStringValue, toNameValue } from '@sdk/index.js';
import { ShareableObject } from '@core/index.js';

export type CompatiblePrimitiveValue = string | symbol | number | boolean | Value | (() => void);
export type CompatibleValue = CompatibleValue[] | { [key in string]: CompatibleValue } | CompatiblePrimitiveValue;

function isValue(value: unknown): value is Value {
  return isObject(value) && value.type in ValueType;
}

function releasePreviousValue(previousValue: Value | undefined): Value | null {
  if (previousValue !== undefined && previousValue.tracker?.releaseValue(previousValue) === false) {
    return null;
  }
  return previousValue ?? null;
}

function _toIReadOnlyArray(values: Value[]): { array: Value[]; iArray: IReadOnlyArray } {
  const array = [...values];
  array.forEach((value) => {
    if (value.tracker) {
      value.tracker.addValueRef(value);
    }
  });
  const iArray: IReadOnlyArray = {
    get length() {
      return array.length;
    },

    at(index: number): Value | null {
      return array[index] ?? null;
    }
  };
  return { array, iArray };
}

function toIArray(values: Value[]): IArray {
  const { array, iArray } = _toIReadOnlyArray(values);
  return Object.assign(iArray, {
    set(index: number, value: Value): Value | null {
      const previousValue = releasePreviousValue(array[index]);
      array[index] = value;
      if (value.tracker) {
        value.tracker.addValueRef(value);
      }
      return previousValue;
    }
  });
}

type ValueDictionary = { [key in string]: Value };

function _toIReadOnlyDictionary(mapping: ValueDictionary): {
  dictionary: ValueDictionary;
  iDictionary: IReadOnlyDictionary;
} {
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
    }
  };
  return { dictionary, iDictionary };
}

function toIDictionary(mapping: ValueDictionary): IDictionary {
  const { dictionary, iDictionary } = _toIReadOnlyDictionary(mapping);
  return Object.assign(iDictionary, {
    def(name: string, value: Value): Value | null {
      const previousValue = releasePreviousValue(dictionary[name]);
      dictionary[name] = value;
      if (value.tracker) {
        value.tracker.addValueRef(value);
      }
      return previousValue;
    }
  });
}

export function toValue(value: boolean, permissions?: Partial<IValuePermissions>): Value<ValueType.boolean>;
export function toValue(value: number, permissions?: Partial<IValuePermissions>): Value<ValueType.integer>;
export function toValue(value: string, permissions?: Partial<IValuePermissions>): Value<ValueType.string>;
export function toValue(name: symbol, permissions?: Partial<IValuePermissions>): Value<ValueType.name>;
export function toValue(value: () => void, permissions?: Partial<IValuePermissions>): Value<ValueType.operator>;
export function toValue(value: CompatibleValue[], permissions?: Partial<IValuePermissions>): ArrayValue;
export function toValue(
  value: { [key in string]: CompatibleValue },
  permissions?: Partial<IValuePermissions>
): DictionaryValue;
export function toValue(value: CompatibleValue, permissions?: Partial<IValuePermissions>): Value;
export function toValue(
  value: CompatibleValue,
  { isReadOnly = false, isExecutable = false }: Partial<IValuePermissions> = {}
): Value {
  if (typeof value === 'string') {
    return toStringValue(value, { isExecutable });
  }
  if (typeof value === 'symbol') {
    const key = Symbol.keyFor(value);
    if (!key) {
      throw new Error('Use Symbol.for to ensure string can be extracted');
    }
    return toNameValue(key, { isExecutable });
  }
  if (typeof value === 'boolean') {
    return toBooleanValue(value);
  }
  if (typeof value === 'number') {
    if (value % 1 !== 0) {
      throw new Error('Only integers are supported');
    }
    return toIntegerValue(value);
  }
  if (typeof value === 'function') {
    return {
      isReadOnly: true,
      isExecutable: true,
      type: ValueType.operator,
      operator: <IOperator>{
        type: OperatorType.implementation,
        name: value.name,
        implementation: value
      }
    };
  }
  if (Array.isArray(value)) {
    if (isExecutable) {
      return {
        type: ValueType.array,
        isExecutable,
        isReadOnly: true,
        array: toIArray(value.map((item) => toValue(item, { isReadOnly, isExecutable })))
      };
    }
    return {
      type: ValueType.array,
      isExecutable,
      isReadOnly,
      array: toIArray(value.map((item) => toValue(item, { isReadOnly, isExecutable })))
    };
  }
  if (isValue(value)) {
    return value;
  }
  const mapping: { [key in string]: Value } = {};
  Object.entries(value).forEach(([name, item]) => {
    mapping[name] = toValue(item, { isReadOnly, isExecutable });
  });
  return {
    type: ValueType.dictionary,
    isExecutable: false,
    isReadOnly,
    dictionary: toIDictionary(mapping)
  };
}

toValue.mark = markValue;

const operator: OperatorValue = {
  type: ValueType.operator,
  isReadOnly: true,
  isExecutable: true,
  operator: {
    name: 'operator'
  }
};

toValue.operator = operator;

export class TestShareableObject extends ShareableObject {
  public disposeCalled: number = 0;

  protected _dispose(): void {
    ++this.disposeCalled;
  }
}

toValue.createSharedObject = (): {
  object: TestShareableObject;
  value: Value;
} => {
  const object = new TestShareableObject();
  const value: Value = {
    type: ValueType.array,
    isReadOnly: true,
    isExecutable: false,
    tracker: ShareableObject.tracker,
    array: object as unknown as IReadOnlyArray
  };
  return { object, value };
};
