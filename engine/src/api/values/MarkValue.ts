import type { Value } from '@api/values/Value.js';
import type { IAbstractValue } from '@api/interfaces/IAbstractValue.js';

export interface IMarkValue extends IAbstractValue {
  readonly type: 'mark';
  readonly isReadOnly: true;
  readonly isExecutable: false;
}

/** A mark */
export type MarkValue = IMarkValue;

export const markValue: Value<'mark'> = {
  type: 'mark',
  isReadOnly: true,
  isExecutable: false
} as const;
