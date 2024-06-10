import { ValueType } from './ValueType.js'
import { ArrayValue } from './ArrayValue.js'
import { BlockValue } from './BlockValue.js'
import { BooleanValue } from './BooleanValue.js'
import { CallValue } from './CallValue.js'
// import { DictionaryValue } from './dictionary.js'
// import { IntegerValue } from './integer.js'
// import { MarkValue } from './mark.js'
// import { OperatorValue } from './operator.js'
// import { StringValue } from './string.js'

/** Generic Value */
export type Value<T = any> = T extends ValueType.boolean ? BooleanValue
  : T extends ValueType.integer ? IntegerValue
    : T extends ValueType.string ? StringValue
      : T extends ValueType.mark ? MarkValue
        : T extends ValueType.block ? BlockValue
          : T extends ValueType.call ? CallValue
            : T extends ValueType.operator ? OperatorValue
              : T extends ValueType.array ? ArrayValue
                : T extends ValueType.dictionary ? DictionaryValue
                  : BooleanValue | IntegerValue | StringValue | MarkValue | BlockValue | CallValue | OperatorValue | ArrayValue | DictionaryValue
