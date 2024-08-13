import type { IAbstractOperator, IException, Value, ValueType } from '@api/index.js';

type IInternalState = unknown;

/** Operand stack */
export interface IOperator extends IAbstractOperator {
  /** Operators like true, false, mark are implemented as a simple value */
  constant?: Value;
  /** When specified, the collected values are kept valid during the operator lifetime (including catch & finally) */
  typeCheck?: Array<ValueType | null>;
  /** Operator implementation */
  implementation?: (state: IInternalState, parameters: readonly Value[]) => void;
  /** Any BaseException is transmitted to it */
  catch?: (state: IInternalState, parameters: readonly Value[], e: IException) => void;
  /** Triggered before unstacking the operator from the call stack */
  finally?: (state: IInternalState, parameters: readonly Value[]) => void;
}
