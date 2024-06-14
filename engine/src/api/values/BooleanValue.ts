import type { ValueType } from '@api/values/ValueType.js';
import type { IAbstractValue } from '@api/interfaces/IAbstractValue.js';

export interface IBooleanValue extends IAbstractValue {
  readonly type: ValueType.boolean;
  readonly isReadOnly: true;
  readonly isExecutable: false;
  readonly isShared: false;
  readonly isSet: boolean;
}

/** A boolean */
export type BooleanValue = IBooleanValue;
