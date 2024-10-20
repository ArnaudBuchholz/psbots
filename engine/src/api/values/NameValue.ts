import type { ValueType } from '@api/values/ValueType.js';
import type { IAbstractValue } from '@api/interfaces/IAbstractValue.js';

interface INameValue extends IAbstractValue {
  readonly type: ValueType.name;
  readonly isReadOnly: true;
  readonly name: string;
}

/** A name */
export type NameValue = INameValue;
