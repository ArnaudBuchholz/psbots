import type { ValueType } from '@api/values/ValueType.js';
import type { BooleanValue } from '@api/values/BooleanValue.js';
import type { IntegerValue } from '@api/values/IntegerValue.js';
import type { StringValue } from '@api/values/StringValue.js';
import type { NameValue } from '@api/values/NameValue.js';
import type { MarkValue } from '@api/values/MarkValue.js';
import type { OperatorValue } from '@api/values/OperatorValue.js';
import type { ArrayValue } from '@api/values/ArrayValue.js';
import type { DictionaryValue } from '@api/values/DictionaryValue.js';
import type { IAbstractOperator } from '@api/interfaces/IAbstractOperator.js';
import type { IReadOnlyArray } from '@api/interfaces/IReadOnlyArray.js';
import type { IArray } from '@api/interfaces/IArray.js';
import type { IReadOnlyDictionary } from '@api/interfaces/IReadOnlyDictionary.js';
import type { IDictionary } from '@api/interfaces/IDictionary.js';

/** Generic Value */
export type Value<T = unknown> = T extends ValueType.boolean
  ? BooleanValue
  : T extends ValueType.integer
    ? IntegerValue
    : T extends ValueType.string
      ? StringValue
      : T extends ValueType.name
        ? NameValue
        : T extends ValueType.mark
          ? MarkValue
          : T extends ValueType.operator
            ? OperatorValue
            : T extends ValueType.array
              ? ArrayValue
              : T extends ValueType.dictionary
                ? DictionaryValue
                :
                    | BooleanValue
                    | IntegerValue
                    | StringValue
                    | NameValue
                    | MarkValue
                    | OperatorValue
                    | ArrayValue
                    | DictionaryValue;

export type ValueOf<T> = T extends ValueType.boolean
  ? boolean
  : T extends ValueType.integer
    ? number
    : T extends ValueType.string
      ? string
      : T extends ValueType.name
        ? string
        : T extends ValueType.mark
          ? null
          : T extends ValueType.operator
            ? IAbstractOperator
            : T extends ValueType.array
              ? IReadOnlyArray | IArray
              : T extends ValueType.dictionary
                ? IReadOnlyDictionary | IDictionary
                : never;
