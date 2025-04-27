import type {
  ArrayValue,
  DictionaryValue,
  IArray,
  IDictionary,
  IReadOnlyArray,
  IReadOnlyDictionary,
  IValuePermissions,
  OperatorValue,
  Result,
  Value
} from '@api/index.js';
import { nullValue, ValueType, trueValue, falseValue } from '@api/index.js';
import type { IOperator } from '@sdk/index.js';
import { isObject, OperatorType, toIntegerValue, toStringValue, toNameValue } from '@sdk/index.js';
import { ShareableObject } from '@core/objects/ShareableObject.js';

export type CompatiblePrimitiveValue = string | symbol | number | boolean | Value | (() => void);
export type CompatibleValue = CompatibleValue[] | { [key in string]: CompatibleValue } | CompatiblePrimitiveValue;

function isValue(value: unknown): value is Value {
  return isObject(value) && value.type in ValueType;
}

function releasePreviousValue(previousValue: Value | undefined): Value {
  if (previousValue !== undefined && previousValue.tracker?.releaseValue(previousValue) === false) {
    return nullValue;
  }
  return previousValue ?? nullValue;
}

function _toIReadOnlyArray(values: Value[]): { array: Value[]; iArray: IReadOnlyArray } {
  const array = [...values];
  for (const value of array) {
    if (value.tracker) {
      value.tracker.addValueRef(value);
    }
  }
  const readOnlyArray: IReadOnlyArray = {
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
    set(index: number, value: Value): Result<Value> {
      const previousValue = releasePreviousValue(array[index]);
      array[index] = value;
      if (value.tracker) {
        value.tracker.addValueRef(value);
      }
      return { success: true, value: previousValue };
    }
  });
}

type ValueDictionary = { [key in string]: Value };

function _toIReadOnlyDictionary(mapping: ValueDictionary): {
  dictionary: ValueDictionary;
  iDictionary: IReadOnlyDictionary;
} {
  const dictionary = { ...mapping };
  for (const value of Object.values(dictionary)) {
    if (value.tracker) {
      value.tracker.addValueRef(value);
    }
  }
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
    def(name: string, value: Value): Result<Value> {
      const previousValue = releasePreviousValue(dictionary[name]);
      dictionary[name] = value;
      if (value.tracker) {
        value.tracker.addValueRef(value);
      }
      return { success: true, value: previousValue };
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
    if (value % 1 !== 0) {
      throw new Error('Only integers are supported');
    }
    const integerResult = toIntegerValue(value);
    if (!integerResult.success) {
      throw integerResult.exception;
    }
    return integerResult.value;
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
  for (const [name, item] of Object.entries(value)) {
    mapping[name] = toValue(item, { isReadOnly, isExecutable });
  }
  return {
    type: ValueType.dictionary,
    isExecutable: false,
    isReadOnly,
    dictionary: toIDictionary(mapping)
  };
}

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
