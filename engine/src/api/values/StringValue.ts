import type { ValueType } from '@api/values/ValueType.js';
import type { IAbstractValue } from '@api/interfaces/IAbstractValue.js';

interface IStringValue extends IAbstractValue {
  readonly type: ValueType.string;
  readonly isReadOnly: true;
  readonly isShared: false;
  readonly string: string;
}

/** A string */
export type StringValue = IStringValue;
