import { ValueType } from '@api/values/ValueType.js';
import type { Value } from '@api/values/Value.js';
import type { IAbstractValue } from '@api/interfaces/IAbstractValue.js';

export interface INullValue extends IAbstractValue {
  readonly type: ValueType.null;
  readonly isReadOnly: true;
  readonly isExecutable: false;
}

/** Null */
export type NullValue = INullValue;

export const nullValue: Value<ValueType.null> = {
  type: ValueType.null,
  isReadOnly: true,
  isExecutable: false
} as const;
