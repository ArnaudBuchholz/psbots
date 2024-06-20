import type { Value, StringValue, IAbstractValue } from '@api/index.js';
import { ValueType } from '@api/index.js';
import { InternalException } from '@sdk/exceptions/InternalException.js';
import { isObject } from '@sdk/checks/isObject.js';

const expectedFlags: { [key in ValueType]?: Partial<IAbstractValue> } = {
  [ValueType.string]: {
    isReadOnly: true
  }
};

function hasInvalidFlag(value: Value): boolean {
  const flags = expectedFlags[value.type];
  if (flags !== undefined) {
    const flagNames: Array<keyof IAbstractValue> = ['isReadOnly', 'isExecutable'];
    for (const flagName of flagNames) {
      const expected = flags[flagName];
      if (expected !== undefined) {
        if (value[flagName] !== expected) {
          return true;
        }
      } else if (typeof value[flagName] !== 'boolean') {
        return true;
      }
    }
  }
  return false;
}

function check<T extends ValueType>(type: T, value: unknown, check: (value: Value<T>) => boolean): void {
  if (!isObject(value) || value.type !== type || hasInvalidFlag(value) || !check(value)) {
    throw new InternalException(`Not a ${type.charAt(0).toUpperCase()}${type.substring(1)}Value`);
  }
}

export function checkStringValue(value: unknown, executable?: boolean): asserts value is StringValue {
  check(ValueType.string, value, ({ isExecutable, string }) => {
    if (typeof string !== 'string') {
      return false;
    }
    if (executable !== undefined && isExecutable !== executable) {
      throw new InternalException(`Not a${executable ? 'a non-' : 'an '}executable StringValue`);
    }
    return true;
  });
}
