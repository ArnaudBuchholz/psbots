import type { Value } from '@api/index.js';
import { ValueType } from '@api/index.js';

export type CompatibleValue = string | number | Value;

export function toValue(value: CompatibleValue): Value {
  const common: {
    isReadOnly: true;
    isExecutable: false;
    isShared: false;
  } = {
    isReadOnly: true,
    isExecutable: false,
    isShared: false
  };
  if (typeof value === 'string') {
    return {
      ...common,
      type: ValueType.string,
      string: value
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
  return value;
}
