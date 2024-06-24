import type { Value, StringValue, IAbstractValue, OperatorValue, ArrayValue, DictionaryValue } from '@api/index.js';
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

type CheckableFlags = {
  isReadOnly?: boolean;
  isExecutable?: boolean;
};

function checkFlags(
  { isReadOnly, isExecutable }: Value,
  { isReadOnly: expectedReadOnly, isExecutable: expectedExecutable }: CheckableFlags = {},
  baseErrorMessage: string
): void {
  if (expectedReadOnly !== undefined && isReadOnly !== expectedReadOnly) {
    if (expectedReadOnly) {
      throw new InternalException(`${baseErrorMessage} (read-only)`);
    }
    throw new InternalException(`${baseErrorMessage} (writable)`);
  }
  if (expectedExecutable !== undefined && isExecutable !== expectedExecutable) {
    if (expectedExecutable) {
      throw new InternalException(`${baseErrorMessage} (executable)`);
    }
    throw new InternalException(`${baseErrorMessage} (not executable)`);
  }
}

function check<T extends ValueType>(
  type: T,
  value: unknown,
  flags: CheckableFlags | undefined,
  check: (value: Value<T>, baseErrorMessage: string) => boolean
): void {
  const baseErrorMessage = `Not a ${type.charAt(0).toUpperCase()}${type.substring(1)}Value`;
  if (!isObject(value) || value.type !== type || hasInvalidFlag(value) || !check(value, baseErrorMessage)) {
    throw new InternalException(baseErrorMessage);
  }
}

export function checkStringValue(value: unknown, flags?: CheckableFlags): asserts value is StringValue {
  check(ValueType.string, value, flags, ({ string }) => {
    return typeof string === 'string';
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

export function checkArrayValue(value: unknown, flags?: CheckableFlags): asserts value is ArrayValue {
  check(ValueType.operator, value, flags, ({ array }) => {
    // TODO check array
  });
}

export function checkDictionaryValue(value: unknown, flags?: CheckableFlags): asserts value is DictionaryValue {
  check(ValueType.operator, value, flags, ({ dictionary }) => {
    // TODO check dictionary
  });
}
