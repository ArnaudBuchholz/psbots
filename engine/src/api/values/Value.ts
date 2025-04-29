import type { NullValue } from '@api/values/NullValue.js';
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
export type Value<T = unknown> = T extends 'null'
  ? NullValue
  : T extends 'boolean'
    ? BooleanValue
    : T extends 'integer'
      ? IntegerValue
      : T extends 'string'
        ? StringValue
        : T extends 'name'
          ? NameValue
          : T extends 'mark'
            ? MarkValue
            : T extends 'operator'
              ? OperatorValue
              : T extends 'array'
                ? ArrayValue
                : T extends 'dictionary'
                  ? DictionaryValue
                  :
                      | NullValue
                      | BooleanValue
                      | IntegerValue
                      | StringValue
                      | NameValue
                      | MarkValue
                      | OperatorValue
                      | ArrayValue
                      | DictionaryValue;

export type ValueOf<T> = T extends 'boolean'
  ? boolean
  : T extends 'integer'
    ? number
    : T extends 'string'
      ? string
      : T extends 'name'
        ? string
        : T extends 'mark'
          ? null
          : T extends 'operator'
            ? IAbstractOperator
            : T extends 'array'
              ? IReadOnlyArray | IArray
              : T extends 'dictionary'
                ? IReadOnlyDictionary | IDictionary
                : never;
