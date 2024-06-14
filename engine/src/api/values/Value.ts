import type { ValueType } from '@api/values/ValueType.js';
import type { BooleanValue } from '@api/values/BooleanValue.js';
import type { IntegerValue } from '@api/values/IntegerValue.js';
import type { StringValue } from '@api/values/StringValue.js';
import type { MarkValue } from '@api/values/MarkValue.js';
import type { OperatorValue } from '@api/values/OperatorValue.js';
import type { ArrayValue } from '@api/values/ArrayValue.js';
import type { DictionaryValue } from '@api/values/DictionaryValue.js';

/** Generic Value */
export type Value<T = unknown> = T extends ValueType.boolean
  ? BooleanValue
  : T extends ValueType.integer
    ? IntegerValue
    : T extends ValueType.string
      ? StringValue
      : T extends ValueType.mark
        ? MarkValue
        : T extends ValueType.operator
          ? OperatorValue
          : T extends ValueType.array
            ? ArrayValue
            : T extends ValueType.dictionary
              ? DictionaryValue
              : BooleanValue | IntegerValue | StringValue | MarkValue | OperatorValue | ArrayValue | DictionaryValue;
