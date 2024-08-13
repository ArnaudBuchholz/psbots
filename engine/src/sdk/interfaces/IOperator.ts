import type { IAbstractOperator, IException, Value, ValueType } from '@api/index.js';
import type { IInternalState } from '@sdk/interfaces/IInternalState.js';

/** Operator */
export interface IOperator extends IAbstractOperator {
  /** Operators like true, false, mark are implemented as a simple value */
  readonly constant?: Value;
  /** When specified, the collected values are kept valid during the operator lifetime (including catch & finally) */
  readonly typeCheck?: Array<ValueType | null>;
  /** Operator implementation */
  readonly implementation?: (state: IInternalState, parameters: readonly Value[]) => void;
  /** Any BaseException is transmitted to it */
  readonly catch?: (state: IInternalState, parameters: readonly Value[], e: IException) => void;
  /** Triggered before unstacking the operator from the call stack */
  readonly finally?: (state: IInternalState, parameters: readonly Value[]) => void;
}
