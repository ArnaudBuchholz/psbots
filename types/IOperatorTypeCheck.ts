import type { IValuePermissions } from './IValuePermissions.js';
import type { ValueType } from './values/ValueType.js';

export interface IOperatorTypeCheck<Type = ValueType> {
  /**
   * * 'null' indicates any value
   * * ValutType.mark indicates mark should be found on the operand stack
   */
  type: Type;
  permissions?: Partial<IValuePermissions>;
}
