import { ValueType } from '@api/values/ValueType.js'
import { BooleanValue } from '@api/values/BooleanValue.js'
import { IntegerValue } from '@api/values/IntegerValue.js'
import { StringValue } from '@api/values/StringValue.js'
import { MarkValue } from '@api/values/MarkValue.js'
import { OperatorValue } from '@api/values/OperatorValue.js'
import { ArrayValue } from '@api/values/ArrayValue.js'
import { DictionaryValue } from '@api/values/DictionaryValue.js'

/** Generic Value */
export type Value<T = any> = T extends ValueType.boolean ? BooleanValue
  : T extends ValueType.integer ? IntegerValue
    : T extends ValueType.string ? StringValue
      : T extends ValueType.mark ? MarkValue
        : T extends ValueType.operator ? OperatorValue
          : T extends ValueType.array ? ArrayValue
            : T extends ValueType.dictionary ? DictionaryValue
              : BooleanValue | IntegerValue | StringValue | MarkValue | OperatorValue | ArrayValue | DictionaryValue
