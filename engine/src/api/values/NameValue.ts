import type { IAbstractValue } from '@api/interfaces/IAbstractValue.js';

interface INameValue extends IAbstractValue {
  readonly type: 'name';
  readonly isReadOnly: true;
  readonly name: string;
}

/** A name */
export type NameValue = INameValue;
