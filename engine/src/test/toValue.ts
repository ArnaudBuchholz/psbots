import type {
  ArrayValue,
  DictionaryValue,
  IArray,
  IDictionary,
  IReadOnlyArray,
  IReadOnlyDictionary,
  MarkValue,
  OperatorValue,
  Value
} from '@api/index.js';
import { ValueType } from '@api/index.js';
import { IOperator, isObject } from '@sdk/index.js';
import { ShareableObject } from '@core/index.js';

export type CompatiblePrimitiveValue = string | number | boolean | Value | Function;
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

function toIReadOnlyArray(values: Value[]): IReadOnlyArray {
  return _toIReadOnlyArray(values).iArray;
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

function toIReadOnlyDictionary(mapping: ValueDictionary): IReadOnlyDictionary {
  return _toIReadOnlyDictionary(mapping).iDictionary;
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

export function toValue(value: boolean, readOnly?: boolean): Value<ValueType.boolean>;
export function toValue(value: number, readOnly?: boolean): Value<ValueType.integer>;
export function toValue(value: string, readOnly?: boolean): Value<ValueType.string>;
export function toValue(value: Function, readOnly?: boolean): Value<ValueType.operator>;
export function toValue(value: CompatibleValue[], readOnly?: boolean): ArrayValue;
export function toValue(value: { [key in string]: CompatibleValue }, readOnly?: boolean): DictionaryValue;
export function toValue(value: CompatibleValue, readOnly?: boolean): Value;
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
  if (typeof value === 'function') {
    return {
      ...common,
      isExecutable: true,
      type: ValueType.operator,
      operator: {
        name: value.name,
        implementation: value
      } as IOperator
    }
  }
  if (Array.isArray(value)) {
    if (readOnly) {
      return {
        ...common,
        type: ValueType.array,
        array: toIReadOnlyArray(value.map((item) => toValue(item, true)))
      };
    }
    return {
      ...common,
      isReadOnly: false,
      type: ValueType.array,
      array: toIArray(value.map((item) => toValue(item, false)))
    };
  }
  if (isValue(value)) {
    return value;
  }
  const mapping: { [key in string]: Value } = {};
  Object.entries(value).forEach(([name, item]) => {
    mapping[name] = toValue(item, readOnly);
  });
  if (readOnly) {
    return {
      ...common,
      type: ValueType.dictionary,
      dictionary: toIReadOnlyDictionary(mapping)
    };
  }
  return {
    ...common,
    isReadOnly: false,
    type: ValueType.dictionary,
    dictionary: toIDictionary(mapping)
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
