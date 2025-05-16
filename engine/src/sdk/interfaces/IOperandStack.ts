import type { Result, Value } from '@api/index.js';
import type { IStack } from '@sdk/index.js';

/** Operand stack */
export interface IOperandStack extends IStack {
  /** Ensures capacity for at least `count` more values */
  reserve: (count: number) => Result<undefined>;
  /** Atomic swap of two elements, fails the engine if indexes are not valid */
  swap: (indexA: number, indexB: number) => void;
  /** Atomic pop then push to reduce memory fragmentation */
  popush: ((count: number) => { success: true; value: number }) &
    ((count: number, valueArray: Value[], ...values: Value[]) => Result<number>) &
    ((count: number, ...values: Value[]) => Result<number>);
}
