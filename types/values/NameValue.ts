import type { IAbstractValue } from '../IAbstractValue.js';

interface INameValue extends IAbstractValue {
  readonly type: 'name';
  readonly isReadOnly: true;
  readonly name: string;
}

/** A name */
export type NameValue = INameValue;
