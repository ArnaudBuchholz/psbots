import type { ValueType } from '@api/values/ValueType.js';
import type { IValueTracker } from '@api/interfaces/IValueTracker';
import type { IDebugSource } from '@api/interfaces/IDebugSource.js';

export interface IAbstractValue {
  readonly type: ValueType;
  readonly isReadOnly: boolean;
  readonly isExecutable: boolean;
  readonly tracker?: IValueTracker;
  readonly debugSource?: IDebugSource;
}
