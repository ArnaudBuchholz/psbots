import { IValuePermissions } from './IValuePermissions.js';
import type { ValueType } from './values/ValueType.js';

export interface IAbstractValue extends IValuePermissions {
  readonly type: ValueType;
}
