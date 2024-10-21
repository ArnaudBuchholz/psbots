import type {
  Value,
  StringValue,
  IAbstractValue,
  OperatorValue,
  ArrayValue,
  DictionaryValue,
  IArray,
  IDictionary,
  IValuePermissions,
  IntegerValue,
  NameValue
} from '@api/index.js';
import { ValueType } from '@api/index.js';
import { InternalException } from '@sdk/exceptions/InternalException.js';
import { isObject } from '@sdk/checks/isObject.js';

const expectedFlags: { [key in ValueType]?: Partial<IAbstractValue> } = {
  [ValueType.string]: {
    isReadOnly: true
  },
  [ValueType.operator]: {
    isReadOnly: true,
    isExecutable: true
  }
};

function hasInvalidFlag(value: Value): boolean {
  const flagNames: (keyof IAbstractValue)[] = ['isReadOnly', 'isExecutable'];
  const flags = expectedFlags[value.type];
  for (const flagName of flagNames) {
    const expected = flags && flags[flagName];
    if (expected !== undefined) {
      if (value[flagName] !== expected) {
        return true;
      }
    } else if (typeof value[flagName] !== 'boolean') {
      return true;
    }
  }
  return false;
}

function checkFlags(
  { isReadOnly, isExecutable }: Value,
  { isReadOnly: expectedReadOnly, isExecutable: expectedExecutable }: Partial<IValuePermissions> = {},
  baseErrorMessage: string
): false {
  if (expectedReadOnly !== undefined && isReadOnly !== expectedReadOnly) {
    if (expectedReadOnly) {
      throw new InternalException(`${baseErrorMessage} (expected read-only)`);
    }
    throw new InternalException(`${baseErrorMessage} (expected writable)`);
  }
  if (expectedExecutable !== undefined && isExecutable !== expectedExecutable) {
    if (expectedExecutable) {
      throw new InternalException(`${baseErrorMessage} (expected executable)`);
    }
    throw new InternalException(`${baseErrorMessage} (expected not executable)`);
  }
  return false;
}

function check<T extends ValueType>(
  type: T,
  value: unknown,
  flags: Partial<IValuePermissions> | undefined,
  check: (value: Value<T>, baseErrorMessage: string) => boolean
): void {
  const baseErrorMessage = `Not a ${type.charAt(0).toUpperCase()}${type.substring(1)}Value`;
  if (
    !isObject(value) ||
    value.type !== type ||
    hasInvalidFlag(value) ||
    checkFlags(value, flags, baseErrorMessage) ||
    !check(value, baseErrorMessage)
  ) {
    throw new InternalException(baseErrorMessage);
  }
}

export function checkIntegerValue(value: unknown): asserts value is IntegerValue {
  check(ValueType.integer, value, undefined, ({ integer }) => {
    return typeof integer === 'number' && integer % 1 === 0;
  });
}

export function checkStringValue(value: unknown, flags?: { isExecutable?: boolean }): asserts value is StringValue {
  check(ValueType.string, value, flags, ({ string }) => {
    return typeof string === 'string';
  });
}

export function checkNameValue(value: unknown, flags?: { isExecutable?: boolean }): asserts value is NameValue {
  check(ValueType.name, value, flags, ({ name }) => {
    return typeof name === 'string';
  });
}

export function checkOperatorValue(value: unknown): asserts value is OperatorValue {
  check(ValueType.operator, value, undefined, ({ operator }) => {
    if (typeof operator.name !== 'string') {
      return false;
    }
    return true;
  });
}

export function checkArrayValue(value: unknown, flags?: Partial<IValuePermissions>): asserts value is ArrayValue {
  check(ValueType.array, value, flags, ({ isReadOnly, array }) => {
    if (!isObject(array)) {
      return false;
    }
    const { length, at, set } = array as IArray;
    return (
      typeof length === 'number' &&
      length >= 0 &&
      typeof at === 'function' &&
      at.length === 1 &&
      (isReadOnly || (typeof set === 'function' && set.length === 2))
    );
  });
}

export function checkDictionaryValue(
  value: unknown,
  flags?: Partial<IValuePermissions>
): asserts value is DictionaryValue {
  check(ValueType.dictionary, value, flags, ({ isReadOnly, dictionary }) => {
    if (!isObject(dictionary)) {
      return false;
    }
    const { names, lookup, def } = dictionary as IDictionary;
    return (
      Array.isArray(names) &&
      names.every((name) => typeof name === 'string') &&
      typeof lookup === 'function' &&
      lookup.length === 1 &&
      (isReadOnly || (typeof def === 'function' && def.length === 2))
    );
  });
}
