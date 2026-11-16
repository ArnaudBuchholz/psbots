import type { IAbstractValue } from '../IAbstractValue.js';
import type { IReadOnlyArray } from '../IReadOnlyArray.js';
import type { IArray } from '../IArray.js';

interface IReadOnlyArrayValue extends IAbstractValue {
  readonly type: 'array';
  readonly isReadOnly: true;
  readonly array: IReadOnlyArray;
}

interface IArrayValue extends IAbstractValue {
  readonly type: 'array';
  readonly isReadOnly: false;
  readonly isExecutable: false;
  readonly array: IArray;
}

/** A collection of values indexed by a number */
export type ArrayValue = IReadOnlyArrayValue | IArrayValue;
