import type { ValueType } from '@api/values/ValueType.js';
import type { IAbstractValue } from '@api/interfaces/IAbstractValue.js';

export interface INullValue extends IAbstractValue {
  readonly type: ValueType.null;
  readonly isReadOnly: true;
  readonly isExecutable: false;
}

/** A mark */
export type NullValue = INullValue;
