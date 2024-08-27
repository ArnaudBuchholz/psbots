import type { IAbstractOperator, Value, ValueType } from '@api/index.js';
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
  readonly typeCheck?: (ValueType | null)[];
  /** Operator implementation */
  readonly implementation: (state: IInternalState, parameters: readonly Value[]) => void;
  /** Offers the possibility to handle operator popping (step === STEP_DONE) */
  readonly callOnPop?: true;
}

/** Operator */
export type IOperator = IConstantOperator | IFunctionOperator;
