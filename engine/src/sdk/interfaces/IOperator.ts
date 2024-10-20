import type { IAbstractOperator, IDebugSource, Value, ValueType } from '@api/index.js';
import type { IInternalState } from '@sdk/interfaces/IInternalState.js';
import type { ToStringOptions } from '@sdk/toString.js';

export enum OperatorType {
  constant,
  implementation
}

export type IFunctionOperatorToString = (options: ToStringOptions & { debugSource?: IDebugSource }) => string;

/** A constant operator is associated to a value (like true, false, mark) */
export interface IConstantOperator extends IAbstractOperator {
  readonly type: OperatorType.constant;
  readonly constant: Value;
}

/** Other operators are implemented with functions */
export interface IFunctionOperator extends IAbstractOperator {
  readonly type: OperatorType.implementation;
  /**
   * When specified, the collected values are kept valid during the operator lifetime
   * Order is significant, for instance :
   * [ValueType.boolean, null] means top of the stack can be anything but next item must be a boolean
   */
  readonly typeCheck?: (ValueType | null)[];
  /**
   * Operator implementation
   * parameters are given in the order indicated by typeCheck
   */
  readonly implementation: (state: IInternalState, parameters: readonly Value[]) => void;
  /**
   * Used when converting operator to string (for call stack rendering)
   */
  readonly toString?: IFunctionOperatorToString;
}

/** Operator */
export type IOperator = IConstantOperator | IFunctionOperator;
