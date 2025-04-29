import type { IValueTracker, Result, Value } from '@api/index.js';

export function toIntegerValue(integer: number): Result<Value<'integer'>> {
  if (integer % 1 !== 0 || integer < Number.MIN_SAFE_INTEGER || integer > Number.MAX_SAFE_INTEGER) {
    return { success: false, exception: 'undefinedResult' };
  }
  return {
    success: true,
    value: {
      type: 'integer',
      isExecutable: false,
      isReadOnly: true,
      integer
    }
  };
}

export function toStringValue(
  string: string,
  { isExecutable = false, tracker }: { isExecutable?: boolean; tracker?: IValueTracker } = {}
): Value<'string'> {
  if (tracker) {
    return {
      type: 'string',
      isExecutable,
      isReadOnly: true,
      string,
      tracker
    };
  }
  return {
    type: 'string',
    isExecutable,
    isReadOnly: true,
    string
  };
}

export function toNameValue(
  name: string,
  { isExecutable = false, tracker }: { isExecutable?: boolean; tracker?: IValueTracker } = {}
): Value<'name'> {
  if (tracker) {
    return {
      type: 'name',
      isExecutable,
      isReadOnly: true,
      name,
      tracker
    };
  }
  return {
    type: 'name',
    isExecutable,
    isReadOnly: true,
    name
  };
}
