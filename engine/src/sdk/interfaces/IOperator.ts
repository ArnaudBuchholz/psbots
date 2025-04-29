import type { IAbstractOperator, IValuePermissions, Result, Value, ValueType } from '@api/index.js';
import type { IInternalState } from '@sdk/interfaces/IInternalState.js';

export enum OperatorType {
  constant,
  implementation
}

/** A constant operator is associated to a value (like true, false, mark) */
export interface IConstantOperator extends IAbstractOperator {
  readonly type: OperatorType.constant;
  readonly constant: Value;
}

export interface IOperatorTypeCheck<Type = ValueType> {
  /**
   * * 'null' indicates any value
   * * ValutType.mark indicates mark should be found on the operand stack
   */
  type: Type;
  permissions?: Partial<IValuePermissions>;
}

/** Other operators are implemented with functions */
export interface IFunctionOperator extends IAbstractOperator {
  readonly type: OperatorType.implementation;
  /**
   * When specified, the collected values are kept valid during the operator lifetime
   * Order is significant, for instance :
   * [{ type: 'boolean' }, { type: 'null' }] means top of the stack can be anything but next item must be a boolean
   */
  readonly typeCheck?: IOperatorTypeCheck[];
  /**
   * Values are given in the same order as typeCheck, for instance :
   * [{ type: 'boolean' }, { type: 'null' }] means values is [Value<'boolean'>, Value]
   */
  readonly implementation: (state: IInternalState, ...values: readonly Value[]) => Result<unknown> | void;
}

/** Operator */
export type IOperator = IConstantOperator | IFunctionOperator;
