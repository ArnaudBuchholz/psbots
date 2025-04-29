import type { IAbstractValue } from '@api/interfaces/IAbstractValue.js';
import type { IReadOnlyArray } from '@api/interfaces/IReadOnlyArray.js';
import type { IArray } from '@api/interfaces/IArray.js';

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
