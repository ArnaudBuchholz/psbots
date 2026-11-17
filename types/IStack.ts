import type { IArray } from './IArray.js';
import type { Value } from './values/Value.js';

export interface IStack extends IArray {
  /**
   * Atomic swap of two elements
   * @throws rangecheckerror
   */
  swap: (indexA: number, indexB: number) => void;
  /** Atomic pop then push to reduce memory fragmentation */
  popush: ((count: number) => void &
    ((count: number, valueArray: Value[], ...values: Value[]) => void) &
    ((count: number, ...values: Value[]) => void));
}
