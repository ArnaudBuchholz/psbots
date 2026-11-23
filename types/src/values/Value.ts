import type { NullValue } from './NullValue.js';
import type { BooleanValue } from './BooleanValue.js';
import type { IntegerValue } from './IntegerValue.js';
import type { StringValue } from './StringValue.js';
import type { NameValue } from './NameValue.js';
import type { MarkValue } from './MarkValue.js';
import type { OperatorValue } from './OperatorValue.js';
import type { ArrayValue } from './ArrayValue.js';
import type { DictionaryValue } from './DictionaryValue.js';

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
                  : | NullValue
                    | BooleanValue
                    | IntegerValue
                    | StringValue
                    | NameValue
                    | MarkValue
                    | OperatorValue
                    | ArrayValue
                    | DictionaryValue;
