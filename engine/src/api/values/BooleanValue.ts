import { ValueType } from '@api/values/ValueType.js';
import type { IAbstractValue } from '@api/interfaces/IAbstractValue.js';

export interface IBooleanValue extends IAbstractValue {
  readonly type: ValueType.boolean;
  readonly isReadOnly: true;
  readonly isExecutable: false;
  readonly isSet: boolean;
}

/** A boolean */
export type BooleanValue = IBooleanValue;

export const trueValue: BooleanValue = {
  type: ValueType.boolean,
  isReadOnly: true,
  isExecutable: false,
  isSet: true
};

export const falseValue: BooleanValue = {
  type: ValueType.boolean,
  isReadOnly: true,
  isExecutable: false,
  isSet: false
};
