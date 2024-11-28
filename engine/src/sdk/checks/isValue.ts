import type {
  Value,
  StringValue,
  IAbstractValue,
  OperatorValue,
  ArrayValue,
  DictionaryValue,
  IDictionary,
  IValuePermissions,
  IntegerValue,
  NameValue
} from '@api/index.js';
import { ValueType } from '@api/index.js';
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
  { isReadOnly: expectedReadOnly, isExecutable: expectedExecutable }: Partial<IValuePermissions> = {}
): boolean {
  if (expectedReadOnly !== undefined && isReadOnly !== expectedReadOnly) {
    return false;
  }
  if (expectedExecutable !== undefined && isExecutable !== expectedExecutable) {
    return false;
  }
  return true;
}

function is<T extends ValueType>(
  type: T,
  value: unknown,
  flags: Partial<IValuePermissions> | undefined,
  check: (value: Value<T>) => boolean
): boolean {
  return isObject(value) && value.type === type && !hasInvalidFlag(value) && checkFlags(value, flags) && check(value);
}

function isInteger(value: unknown): value is number {
  return typeof value === 'number' && value % 1 === 0;
}

export function isIntegerValue(value: unknown): value is IntegerValue {
  return is(ValueType.integer, value, undefined, ({ integer }) => isInteger(integer));
}

export function isStringValue(value: unknown, flags?: { isExecutable?: boolean }): value is StringValue {
  return is(ValueType.string, value, flags, ({ string }) => typeof string === 'string');
}

export function isNameValue(value: unknown, flags?: { isExecutable?: boolean }): value is NameValue {
  return is(ValueType.name, value, flags, ({ name }) => typeof name === 'string');
}

export function isOperatorValue(value: unknown): value is OperatorValue {
  return is(ValueType.operator, value, undefined, ({ operator }) => typeof operator.name === 'string');
}

const isFunction = (value: unknown, expectedLength: number): boolean =>
  typeof value === 'function' && value.length === expectedLength;

const isPositiveInteger = (value: unknown): boolean => isInteger(value) && value >= 0;

export function isArrayValue(value: unknown, flags?: Partial<IValuePermissions>): value is ArrayValue {
  return is(
    ValueType.array,
    value,
    flags,
    ({ isReadOnly, array }) =>
      isPositiveInteger(array.length) && isFunction(array.at, 1) && (isReadOnly || isFunction(array.set, 2))
  );
}

export function isDictionaryValue(value: unknown, flags?: Partial<IValuePermissions>): value is DictionaryValue {
  return is(ValueType.dictionary, value, flags, ({ isReadOnly, dictionary }) => {
    const { names, lookup, def } = dictionary as IDictionary;
    return (
      Array.isArray(names) &&
      names.every((name) => typeof name === 'string') &&
      isFunction(lookup, 1) &&
      (isReadOnly || isFunction(def, 2))
    );
  });
}
