import type { ValueType } from '@api/values/ValueType.js';
import type { IDebugSource } from '@api/interfaces/IDebugSource.js';

export interface IValueTracker {
  addValueRef: (value: IAbstractValue) => void;
  releaseValue: (value: IAbstractValue) => void;
}

export interface IAbstractValue {
  readonly type: ValueType;
  readonly isReadOnly: boolean;
  readonly isExecutable: boolean;
  readonly tracker?: IValueTracker;
  readonly debugSource?: IDebugSource;
}
