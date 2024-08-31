import type { Value } from '@api/index.js';
import { ValueType } from '@api/index.js';
import type { MemoryTracker } from '@core/MemoryTracker';

export function toBooleanValue(isSet: boolean): Value<ValueType.boolean> {
  return {
    type: ValueType.boolean,
    isExecutable: false,
    isReadOnly: true,
    isSet
  };
}

export function toIntegerValue(integer: number): Value<ValueType.integer> {
  return {
    type: ValueType.integer,
    isExecutable: false,
    isReadOnly: true,
    integer
  };
}

export function toStringValue(
  string: string,
  {
    isExecutable = false,
    memoryTracker = undefined
  }: {
    isExecutable?: boolean;
    memoryTracker?: MemoryTracker;
  } = {}
): Value<ValueType.string> {
  if (memoryTracker !== undefined) {
    return {
      type: ValueType.string,
      isExecutable,
      isReadOnly: true,
      string,
      tracker: memoryTracker
    };
  }
  return {
    type: ValueType.string,
    isExecutable,
    isReadOnly: true,
    string
  };
}

export function toMarkValue(): Value<ValueType.mark> {
  return {
    type: ValueType.mark,
    isReadOnly: true,
    isExecutable: false
  };
}
