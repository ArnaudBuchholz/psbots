import type { ValueType } from '@api/values/ValueType.js';
import type { IAbstractValue } from '@api/interfaces/IAbstractValue.js';

/** A boolean */
export interface IIntegerValue extends IAbstractValue {
  readonly type: ValueType.integer;
  readonly isReadOnly: true;
  readonly isExecutable: false;
  readonly integer: number;
}

/** An integer */
export type IntegerValue = IIntegerValue;
