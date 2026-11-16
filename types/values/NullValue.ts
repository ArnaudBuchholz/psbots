import type { IAbstractValue } from '../IAbstractValue.js';

export interface INullValue extends IAbstractValue {
  readonly type: 'null';
  readonly isReadOnly: true;
  readonly isExecutable: false;
}

/** Null */
export type NullValue = INullValue;

export const nullValue: NullValue = {
  type: 'null',
  isReadOnly: true,
  isExecutable: false
} as const;
