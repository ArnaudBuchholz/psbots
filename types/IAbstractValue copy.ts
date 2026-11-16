import type { ValueType } from '@api/values/ValueType.js';
import type { IValueTracker } from '@api/interfaces/IValueTracker.js';
import type { IDebugSource } from '@api/interfaces/IDebugSource.js';

export interface IValuePermissions {
  readonly isReadOnly: boolean;
  readonly isExecutable: boolean;
}

export interface IAbstractValue extends IValuePermissions {
  readonly type: ValueType;
  readonly tracker?: IValueTracker;
  readonly debugSource?: IDebugSource;
}
