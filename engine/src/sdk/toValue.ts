import type { IValueTracker, Result, Value } from '@api/index.js';
import { ValueType } from '@api/index.js';

export function toBooleanValue(isSet: boolean): Value<ValueType.boolean> {
  return {
    type: ValueType.boolean,
    isExecutable: false,
    isReadOnly: true,
    isSet
  };
}

export function toIntegerValue(integer: number): Result<Value<ValueType.integer>> {
  if (integer % 1 !== 0 || integer < Number.MIN_SAFE_INTEGER || integer > Number.MAX_SAFE_INTEGER) {
    return { success: false, exception: 'undefinedResult' };
  }
  return {
    success: true,
    value: {
      type: ValueType.integer,
      isExecutable: false,
      isReadOnly: true,
      integer
    }
  };
}

export function toStringValue(
  string: string,
  { isExecutable = false, tracker }: { isExecutable?: boolean; tracker?: IValueTracker } = {}
): Value<ValueType.string> {
  if (tracker) {
    return {
      type: ValueType.string,
      isExecutable,
      isReadOnly: true,
      string,
      tracker
    };
  }
  return {
    type: ValueType.string,
    isExecutable,
    isReadOnly: true,
    string
  };
}

export function toNameValue(
  name: string,
  { isExecutable = false, tracker }: { isExecutable?: boolean; tracker?: IValueTracker } = {}
): Value<ValueType.name> {
  if (tracker) {
    return {
      type: ValueType.name,
      isExecutable,
      isReadOnly: true,
      name,
      tracker
    };
  }
  return {
    type: ValueType.name,
    isExecutable,
    isReadOnly: true,
    name
  };
}
