import type { IAbstractValue } from '@api/interfaces/IAbstractValue.js';

interface IStringValue extends IAbstractValue {
  readonly type: 'string';
  readonly isReadOnly: true;
  readonly string: string;
}

/** A string */
export type StringValue = IStringValue;
