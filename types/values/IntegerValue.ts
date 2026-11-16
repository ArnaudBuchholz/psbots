import type { IAbstractValue } from '../IAbstractValue.js';

/** A boolean */
export interface IIntegerValue extends IAbstractValue {
  readonly type: 'integer';
  readonly isReadOnly: true;
  readonly isExecutable: false;
  readonly integer: number;
}

/** An integer */
export type IntegerValue = IIntegerValue;
