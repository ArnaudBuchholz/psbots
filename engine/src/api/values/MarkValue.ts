import { ValueType } from '@api/values/ValueType.js';
import type { IAbstractValue } from '@api/interfaces/IAbstractValue.js';

export interface IMarkValue extends IAbstractValue {
  readonly type: ValueType.mark;
  readonly isReadOnly: true;
  readonly isExecutable: false;
}

/** A mark */
export type MarkValue = IMarkValue;

export const markValue = {
  type: ValueType.mark,
  isReadOnly: true,
  isExecutable: false
};
