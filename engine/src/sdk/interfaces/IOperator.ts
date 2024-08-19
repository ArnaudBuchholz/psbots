import type { IAbstractOperator, IException, Value, ValueType } from '@api/index.js';
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

/** Other operators are implemented with functions */
export interface IFunctionOperator extends IAbstractOperator {
  readonly type: OperatorType.implementation;
  /** When specified, the collected values are kept valid during the operator lifetime (including catch & finally) */
  readonly typeCheck?: Array<ValueType | null>;
  /** Operator implementation */
  readonly implementation: (state: IInternalState, parameters: readonly Value[]) => void;
  /** Any BaseException is transmitted to it */
  readonly catch?: (state: IInternalState, parameters: readonly Value[], e: IException) => void;
  /** Triggered before unstacking the operator from the call stack */
  readonly finally?: (state: IInternalState, parameters: readonly Value[]) => void;
}

/** Operator */
export type IOperator = IConstantOperator | IFunctionOperator;
