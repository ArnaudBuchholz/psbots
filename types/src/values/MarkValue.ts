import type { IAbstractValue } from '../IAbstractValue.js';

export interface IMarkValue extends IAbstractValue {
  readonly type: 'mark';
  readonly isReadOnly: true;
  readonly isExecutable: false;
}

/** A mark */
export type MarkValue = IMarkValue;

export const markValue: MarkValue = {
  type: 'mark',
  isReadOnly: true,
  isExecutable: false
} as const;
